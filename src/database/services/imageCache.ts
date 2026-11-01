import { imageCacheDb } from "../imageCacheDb.ts";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const LASTFM_PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";
export const LASTFM_DEFAULT_AVATAR_HASH = "818148bf682d429dc215c1705eb27b98";

export type ImageCacheMediaInfo = {
  track?: string;
  album?: string;
  artist?: string;
};

imageCacheDb.exec(`
  CREATE TABLE IF NOT EXISTS image_urls (
    cache_key   TEXT PRIMARY KEY,
    media_type  TEXT NOT NULL,
    image_url   TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  ) WITHOUT ROWID;
`);
imageCacheDb.exec(
  "CREATE INDEX IF NOT EXISTS idx_image_urls_updated_at ON image_urls (updated_at);",
);

const stmtGet = imageCacheDb.prepare(
  "SELECT image_url, updated_at FROM image_urls WHERE cache_key = ?",
);
const stmtDeleteByKey = imageCacheDb.prepare(
  "DELETE FROM image_urls WHERE cache_key = ?",
);
const stmtUpsert = imageCacheDb.prepare(`
  INSERT INTO image_urls (cache_key, media_type, image_url, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(cache_key) DO UPDATE SET
    media_type = excluded.media_type,
    image_url = excluded.image_url,
    updated_at = excluded.updated_at
`);
const stmtUpdateUrl = imageCacheDb.prepare(
  "UPDATE image_urls SET image_url = ?, updated_at = ? WHERE image_url = ?",
);
const stmtDeleteByUrl = imageCacheDb.prepare(
  "DELETE FROM image_urls WHERE image_url = ?",
);
const stmtCount = imageCacheDb.prepare(
  "SELECT COUNT(*) AS count FROM image_urls",
);

function normalizePart(value?: string): string {
  return (value || "").trim().toLowerCase();
}

export function buildImageCacheKey(
  mediaType: "tracks" | "albums" | "artists",
  info: ImageCacheMediaInfo,
): string | null {
  const artist = normalizePart(info.artist);
  const album = normalizePart(info.album);
  const track = normalizePart(info.track);

  if (mediaType === "artists") {
    return artist ? `artist:${artist}` : null;
  }

  if (mediaType === "albums") {
    return artist && album ? `album:${artist}:${album}` : null;
  }

  if (mediaType === "tracks") {
    if (artist && album) {
      return `album:${artist}:${album}`;
    }
    return artist && track ? `track:${artist}:${track}` : null;
  }

  return null;
}

export function isPlaceholderImageUrl(url?: string | null): boolean {
  if (!url) return true;
  return (
    url.includes(LASTFM_PLACEHOLDER_HASH) ||
    url.includes(LASTFM_DEFAULT_AVATAR_HASH)
  );
}

// deno-lint-ignore require-await
export async function getCachedImageUrl(
  mediaType: "tracks" | "albums" | "artists",
  info: ImageCacheMediaInfo,
): Promise<string | null> {
  try {
    const cacheKey = buildImageCacheKey(mediaType, info);
    if (!cacheKey) return null;

    const row = stmtGet.get(cacheKey) as
      | { image_url: string; updated_at: string }
      | undefined;

    if (!row) return null;

    const updatedMs = new Date(row.updated_at).getTime();
    if (Number.isNaN(updatedMs) || Date.now() - updatedMs > CACHE_TTL_MS) {
      stmtDeleteByKey.run(cacheKey);
      return null;
    }

    if (isPlaceholderImageUrl(row.image_url)) {
      return null;
    }

    return row.image_url.replace(
      "lastfm-img.freetls.fastly.net",
      "lastfm.freetls.fastly.net",
    );
  } catch (error) {
    console.error("ImageCache: read error:", error);
    return null;
  }
}

// deno-lint-ignore require-await
export async function setCachedImageUrl(
  mediaType: "tracks" | "albums" | "artists",
  info: ImageCacheMediaInfo,
  rawImageUrl: string | null | undefined,
): Promise<string | null> {
  const imageUrl = rawImageUrl?.replace(
    "lastfm-img.freetls.fastly.net",
    "lastfm.freetls.fastly.net",
  );
  if (!imageUrl || isPlaceholderImageUrl(imageUrl)) {
    return imageUrl || null;
  }

  try {
    const cacheKey = buildImageCacheKey(mediaType, info);
    if (!cacheKey) return imageUrl;

    const now = new Date().toISOString();
    stmtUpsert.run(cacheKey, mediaType, imageUrl, now);
    return imageUrl;
  } catch (error) {
    console.error("ImageCache: save error:", error);
    return imageUrl;
  }
}

// deno-lint-ignore require-await
export async function updateCachedImageUrl(
  oldImageUrl: string,
  newImageUrl: string,
): Promise<void> {
  if (!oldImageUrl || !newImageUrl || oldImageUrl === newImageUrl) return;
  try {
    const now = new Date().toISOString();
    stmtUpdateUrl.run(newImageUrl, now, oldImageUrl);
  } catch (error) {
    console.error("ImageCache: update error:", error);
  }
}

// deno-lint-ignore require-await
export async function deleteCachedImageByUrl(imageUrl: string): Promise<void> {
  try {
    stmtDeleteByUrl.run(imageUrl);
  } catch (error) {
    console.error("ImageCache: delete error:", error);
  }
}

// deno-lint-ignore require-await
export async function countCachedImages(): Promise<number> {
  try {
    const row = stmtCount.get() as { count: number | bigint } | undefined;
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}
