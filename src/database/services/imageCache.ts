import { imageCacheDb } from "../imageCacheDb.ts";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const LASTFM_PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";
export const LASTFM_DEFAULT_AVATAR_HASH = "818148bf682d429dc215c1705eb27b98";

export const KNOWN_PLACEHOLDER_HASHES = new Set([
  "2a96cbd8b46e442fc41c2b86b821562f", // standard album/track 500x500 star
  "4128a6eb29f94943c9d206c08e625904", // standard artist & album 300x300 / 500x500 star
  "818148bf682d429dc215c1705eb27b98", // default user avatar silhouette
  "c6f59c1e5e7240a4c0d427abd71f3dbb", // secondary default avatar
  "52a504a12da6",                     // lastfm_avatar_twitter
]);

const PLACEHOLDER_URL_PATTERNS = [
  /default_album/i,
  /default_artist/i,
  /noimage/i,
  /no-image/i,
  /placeholder/i,
  /lastfm_avatar/i,
];

const deadImageUrls = new Map<string, number>();
const DEAD_URL_TTL_MS = 60 * 1000; // 60 seconds temporary cooldown for failing URLs

export function markDeadImageUrl(url: string, ttlMs = DEAD_URL_TTL_MS): void {
  if (!url) return;
  deadImageUrls.set(url.trim().toLowerCase(), Date.now() + ttlMs);
}

export function unmarkDeadImageUrl(url?: string | null): void {
  if (!url) return;
  deadImageUrls.delete(url.trim().toLowerCase());
}

export function isDeadImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const key = url.trim().toLowerCase();
  const expiresAt = deadImageUrls.get(key);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    deadImageUrls.delete(key);
    return false;
  }
  return true;
}

export function clearDeadImageUrls(): void {
  deadImageUrls.clear();
}

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

// Purge any placeholder URLs that may have been cached in past executions
imageCacheDb.exec(`
  DELETE FROM image_urls
  WHERE
    image_url LIKE '%2a96cbd8b46e442fc41c2b86b821562f%' OR
    image_url LIKE '%4128a6eb29f94943c9d206c08e625904%' OR
    image_url LIKE '%818148bf682d429dc215c1705eb27b98%' OR
    image_url LIKE '%c6f59c1e5e7240a4c0d427abd71f3dbb%' OR
    image_url LIKE '%52a504a12da6%' OR
    image_url LIKE '%default_album%' OR
    image_url LIKE '%default_artist%' OR
    image_url LIKE '%noimage%';
`);

// Migrate legacy lastfm.freetls.fastly.net to official lastfm-img.freetls.fastly.net CDN
imageCacheDb.exec(`
  UPDATE OR IGNORE image_urls
  SET image_url = REPLACE(image_url, 'lastfm.freetls.fastly.net', 'lastfm-img.freetls.fastly.net')
  WHERE image_url LIKE '%lastfm.freetls.fastly.net%';

  DELETE FROM image_urls
  WHERE image_url LIKE '%lastfm.freetls.fastly.net%';

  -- Purge previous Deezer artist cache entries so they re-resolve via the official Last.fm og:image pipeline
  DELETE FROM image_urls
  WHERE image_url LIKE '%dzcdn.net%' AND media_type = 'artists';
`);

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
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return true;

  for (const hash of KNOWN_PLACEHOLDER_HASHES) {
    if (trimmed.includes(hash)) return true;
  }

  for (const pattern of PLACEHOLDER_URL_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
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

    if (isPlaceholderImageUrl(row.image_url) || isDeadImageUrl(row.image_url)) {
      stmtDeleteByKey.run(cacheKey);
      return null;
    }

    return row.image_url.replace(
      "lastfm.freetls.fastly.net",
      "lastfm-img.freetls.fastly.net",
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
    "lastfm.freetls.fastly.net",
    "lastfm-img.freetls.fastly.net",
  );
  if (
    !imageUrl ||
    isPlaceholderImageUrl(imageUrl) ||
    isDeadImageUrl(imageUrl)
  ) {
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
    markDeadImageUrl(imageUrl);
    stmtDeleteByUrl.run(imageUrl);
    const cropRegex = /\/(?:\d+x\d+|\d+s|avatar\d+s|ar0)\//;
    if (cropRegex.test(imageUrl)) {
      stmtDeleteByUrl.run(imageUrl.replace(cropRegex, "/500x500/"));
      stmtDeleteByUrl.run(imageUrl.replace(cropRegex, "/300x300/"));
    }
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
