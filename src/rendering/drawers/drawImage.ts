import {
  deleteImageBlob,
  getImageBlob,
  setImageBlob,
} from "@/database/imageBlobStore.ts";
import {
  deleteCachedImageByUrl,
  updateCachedImageUrl,
} from "@/database/services/imageCache.ts";
import { DEFAULT_IMAGE, fetchWithRetry } from "@/services/lastfm/client.ts";
import { Buffer } from "node:buffer";
import { resolve } from "node:path";
import process from "node:process";
import {
  type CanvasRenderingContext2D,
  type Image,
  loadImage,
} from "skia-canvas";
import { withContextEffects } from "../effects/contextEffects.ts";
import type { ImageElement } from "../types.ts";
import { drawRect } from "./drawShape.ts";

// Static local image cache (icons, logos) — tiny, fixed set of files
const localImageCache = new Map<string, Image>();

// In-flight downloads, so concurrent renders of the same cover share one request
const pendingDownloads = new Map<string, Promise<Uint8Array | null>>();

function buildLastfmFallbackCandidates(rawUrl: string): string[] {
  const normalized = rawUrl
    .trim()
    .replace("lastfm-img.freetls.fastly.net", "lastfm.freetls.fastly.net");

  const candidates = new Set<string>([normalized]);
  const cropRegex = /\/(?:\d+x\d+|\d+s|ar0)\//;

  if (cropRegex.test(normalized)) {
    candidates.add(normalized.replace(cropRegex, "/300x300/"));
    candidates.add(normalized.replace(cropRegex, "/ar0/"));

    if (normalized.endsWith(".png")) {
      const asJpg = normalized.slice(0, -4) + ".jpg";
      candidates.add(asJpg);
      candidates.add(asJpg.replace(cropRegex, "/300x300/"));
    } else if (normalized.endsWith(".jpg")) {
      const asPng = normalized.slice(0, -4) + ".png";
      candidates.add(asPng);
      candidates.add(asPng.replace(cropRegex, "/300x300/"));
    }
  }

  return [...candidates];
}

async function fetchRemoteImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetchWithRetry(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      },
      2,
      6000,
    );

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return null;
    }

    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * Returns image bytes for a URL: persistent SQLite blob cache first,
 * then network (deduplicated across concurrent renders) and stores the result.
 */
function getImageBytes(url: string): Promise<Uint8Array | null> {
  const cached = getImageBlob(url);
  if (cached) return Promise.resolve(cached);

  const pending = pendingDownloads.get(url);
  if (pending) return pending;

  const download = fetchRemoteImageBuffer(url)
    .then((buffer) => {
      if (buffer) setImageBlob(url, buffer);
      return buffer;
    })
    .finally(() => pendingDownloads.delete(url));

  pendingDownloads.set(url, download);
  return download;
}

async function loadCachedImage(src: string): Promise<Image> {
  if (src.startsWith("./src/")) {
    const resolved = resolve(process.cwd(), src);
    const cached = localImageCache.get(resolved);
    if (cached) return cached;

    const img = await loadImage(resolved);
    localImageCache.set(resolved, img);
    return img;
  }

  const candidates = buildLastfmFallbackCandidates(src);

  for (const candidateUrl of candidates) {
    const bytes = await getImageBytes(candidateUrl);
    if (!bytes) continue;

    try {
      const img = await loadImage(Buffer.from(bytes));
      if (candidateUrl !== src) {
        await updateCachedImageUrl(src, candidateUrl);
      }
      return img;
    } catch {
      // Corrupted/undecodable bytes: drop them and try the next candidate
      deleteImageBlob(candidateUrl);
    }
  }

  // Self-healing: remove broken URL from the URL cache so next run re-resolves it
  await deleteCachedImageByUrl(src);
  if (candidates[0] && candidates[0] !== src) {
    await deleteCachedImageByUrl(candidates[0]);
  }

  if (src !== DEFAULT_IMAGE) {
    const fallbackBytes = await getImageBytes(DEFAULT_IMAGE);
    if (fallbackBytes) {
      return await loadImage(Buffer.from(fallbackBytes));
    }
  }

  throw new Error(`Failed to load remote image after fallbacks: ${src}`);
}

/**
 * Loads (cache → network) all images of a template in parallel.
 * The returned map lives only for the duration of a single render.
 */
export async function preloadImages(
  srcs: string[],
): Promise<Map<string, Image | Error>> {
  const unique = [...new Set(srcs)];
  const entries = await Promise.all(
    unique.map(async (src): Promise<[string, Image | Error]> => {
      try {
        return [src, await loadCachedImage(src)];
      } catch (error) {
        return [src, error instanceof Error ? error : new Error(String(error))];
      }
    }),
  );
  return new Map(entries);
}

export async function drawImage(
  ctx: CanvasRenderingContext2D,
  element: ImageElement,
  preloaded?: Map<string, Image | Error>,
): Promise<void> {
  try {
    const pre = preloaded?.get(element.src);
    if (pre instanceof Error) throw pre;
    const image = pre ?? await loadCachedImage(element.src);

    await withContextEffects(ctx, element, (c) => {
      if (element.rotation) {
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        c.translate(cx, cy);
        c.rotate((element.rotation * Math.PI) / 180);
        c.translate(-cx, -cy);
      }

      const radius = element.borderRadius ?? 0;
      if (radius > 0 && typeof c.roundRect === "function") {
        c.beginPath();
        c.roundRect(
          element.x,
          element.y,
          element.width,
          element.height,
          radius,
        );
        c.clip();
      }

      if (element.objectFit === "cover" && image.width > 0 && image.height > 0) {
        const targetRatio = element.width / element.height;
        const imgRatio = image.width / image.height;

        let sx = 0;
        let sy = 0;
        let sw = image.width;
        let sh = image.height;

        if (imgRatio > targetRatio) {
          sw = image.height * targetRatio;
          sx = (image.width - sw) / 2;
        } else {
          sh = image.width / targetRatio;
          sy = (image.height - sh) / 2;
        }

        c.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          element.x,
          element.y,
          element.width,
          element.height,
        );
      } else {
        c.drawImage(image, element.x, element.y, element.width, element.height);
      }
    });
  } catch (error) {
    console.error("Error on loadImage:", error, element.src);
    await drawRect(ctx, {
      type: "rectangle",
      fillStyle: "rgba(0, 0, 0, 0.5)",
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    });
  }
}
