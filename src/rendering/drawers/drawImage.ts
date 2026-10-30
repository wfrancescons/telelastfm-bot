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

// Static local image cache (icons, logos)
const localImageCache = new Map<string, Image>();

// Bounded LRU in-memory cache for decoded remote images
const MAX_REMOTE_CACHE_ENTRIES = 150;
const remoteImageCache = new Map<string, Image>();

function getFromRemoteCache(key: string): Image | undefined {
  const existing = remoteImageCache.get(key);
  if (existing) {
    // Refresh LRU order
    remoteImageCache.delete(key);
    remoteImageCache.set(key, existing);
  }
  return existing;
}

function setInRemoteCache(key: string, image: Image): void {
  if (remoteImageCache.has(key)) {
    remoteImageCache.delete(key);
  } else if (remoteImageCache.size >= MAX_REMOTE_CACHE_ENTRIES) {
    const oldestKey = remoteImageCache.keys().next().value;
    if (oldestKey) remoteImageCache.delete(oldestKey);
  }
  remoteImageCache.set(key, image);
}

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

async function loadCachedImage(src: string): Promise<Image> {
  if (src.startsWith("./src/")) {
    const resolved = resolve(process.cwd(), src);
    const cached = localImageCache.get(resolved);
    if (cached) return cached;

    const img = await loadImage(resolved);
    localImageCache.set(resolved, img);
    return img;
  }

  const cachedRemote = getFromRemoteCache(src);
  if (cachedRemote) return cachedRemote;

  const candidates = buildLastfmFallbackCandidates(src);

  for (const candidateUrl of candidates) {
    const cachedCandidate = getFromRemoteCache(candidateUrl);
    if (cachedCandidate) {
      setInRemoteCache(src, cachedCandidate);
      return cachedCandidate;
    }

    const buffer = await fetchRemoteImageBuffer(candidateUrl);
    if (buffer) {
      const img = await loadImage(buffer);
      setInRemoteCache(candidateUrl, img);
      setInRemoteCache(src, img);
      if (candidateUrl !== src) {
        await updateCachedImageUrl(src, candidateUrl);
      }
      return img;
    }
  }

  // Self-healing: remove broken URL from SQLite cache so next run re-resolves it
  await deleteCachedImageByUrl(src);
  if (candidates[0] && candidates[0] !== src) {
    await deleteCachedImageByUrl(candidates[0]);
  }

  if (src !== DEFAULT_IMAGE) {
    const fallbackBuf = await fetchRemoteImageBuffer(DEFAULT_IMAGE);
    if (fallbackBuf) {
      const fallbackImg = await loadImage(fallbackBuf);
      setInRemoteCache(DEFAULT_IMAGE, fallbackImg);
      return fallbackImg;
    }
  }

  throw new Error(`Failed to load remote image after fallbacks: ${src}`);
}

export async function drawImage(
  ctx: CanvasRenderingContext2D,
  element: ImageElement,
): Promise<void> {
  try {
    const image = await loadCachedImage(element.src);

    await withContextEffects(ctx, element, (c) => {
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
