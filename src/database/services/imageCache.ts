import { db } from "../schema.ts";

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const LASTFM_PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

export type ImageCacheMediaInfo = {
  track?: string;
  album?: string;
  artist?: string;
};

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
  return url.includes(LASTFM_PLACEHOLDER_HASH);
}

export async function getCachedImageUrl(
  mediaType: "tracks" | "albums" | "artists",
  info: ImageCacheMediaInfo,
): Promise<string | null> {
  try {
    const cacheKey = buildImageCacheKey(mediaType, info);
    if (!cacheKey) return null;

    const row = await db.selectFrom("image_cache")
      .selectAll()
      .where("cache_key", "=", cacheKey)
      .executeTakeFirst();

    if (!row) return null;

    const updatedMs = new Date(row.updated_at).getTime();
    if (Number.isNaN(updatedMs) || Date.now() - updatedMs > CACHE_TTL_MS) {
      await db.deleteFrom("image_cache")
        .where("cache_key", "=", cacheKey)
        .execute();
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
    console.error("DB: Error reading image cache:", error);
    return null;
  }
}

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
    const existing = await db.selectFrom("image_cache")
      .select("cache_key")
      .where("cache_key", "=", cacheKey)
      .executeTakeFirst();

    if (existing) {
      await db.updateTable("image_cache")
        .set({
          media_type: mediaType,
          image_url: imageUrl,
          updated_at: now,
        })
        .where("cache_key", "=", cacheKey)
        .execute();
    } else {
      await db.insertInto("image_cache")
        .values({
          cache_key: cacheKey,
          media_type: mediaType,
          image_url: imageUrl,
          updated_at: now,
        })
        .execute();
    }

    return imageUrl;
  } catch (error) {
    console.error("DB: Error saving image cache:", error);
    return imageUrl;
  }
}

export async function updateCachedImageUrl(
  oldImageUrl: string,
  newImageUrl: string,
): Promise<void> {
  if (!oldImageUrl || !newImageUrl || oldImageUrl === newImageUrl) return;
  try {
    await db.updateTable("image_cache")
      .set({
        image_url: newImageUrl,
        updated_at: new Date().toISOString(),
      })
      .where("image_url", "=", oldImageUrl)
      .execute();
  } catch (error) {
    console.error("DB: Error updating cached image URL:", error);
  }
}

export async function deleteCachedImageByUrl(imageUrl: string): Promise<void> {
  try {
    await db.deleteFrom("image_cache")
      .where("image_url", "=", imageUrl)
      .execute();
  } catch (error) {
    console.error("DB: Error deleting invalid cached image URL:", error);
  }
}

export async function countCachedImages(): Promise<number> {
  try {
    const result = await db.selectFrom("image_cache")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  } catch {
    return 0;
  }
}

