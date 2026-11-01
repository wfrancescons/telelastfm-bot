/**
 * Persistent image byte cache backed by a dedicated SQLite file.
 *
 * Why a separate SQLite file (and not the main DB, disk files or RAM)?
 * - Main DB stays small: BLOBs never bloat users/logs tables, WAL or backups.
 * - Faster than one-file-per-image for small blobs (~20-100 KB): a single open
 *   file, no inode/dir overhead, atomic writes, no orphan/partial files.
 * - LRU eviction is a single indexed SQL query (ORDER BY last_access).
 * - Hot pages are served by the OS page cache, so the process RSS stays flat
 *   (decoded images are never kept in memory between renders).
 * - The file is disposable: deleting it only costs re-downloads.
 *
 * Uses raw prepared statements (instead of Kysely) because this is the hot
 * path of every rendered collage and statements are compiled only once.
 */
import config from "@/config.ts";
import { imageCacheDb as sqlite } from "./imageCacheDb.ts";

const MAX_BYTES = config.imageCache.maxSizeMb * 1024 * 1024;
// Evict down to this fraction of the cap to avoid evicting on every insert
const EVICT_TARGET_RATIO = 0.9;
// Only touch last_access if it is older than this (avoids a write on every hit)
const TOUCH_INTERVAL_MS = 6 * 60 * 60 * 1000;
// Check the size cap every N inserts
const EVICT_CHECK_EVERY = 50;

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS image_blobs (
    url         TEXT PRIMARY KEY,
    data        BLOB NOT NULL,
    size        INTEGER NOT NULL,
    created_at  INTEGER NOT NULL,
    last_access INTEGER NOT NULL
  ) WITHOUT ROWID;
`);
sqlite.exec(
  "CREATE INDEX IF NOT EXISTS idx_image_blobs_last_access ON image_blobs (last_access);",
);

const stmtGet = sqlite.prepare(
  "SELECT data, last_access FROM image_blobs WHERE url = ?",
);
const stmtTouch = sqlite.prepare(
  "UPDATE image_blobs SET last_access = ? WHERE url = ?",
);
const stmtUpsert = sqlite.prepare(`
  INSERT INTO image_blobs (url, data, size, created_at, last_access)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(url) DO UPDATE SET
    data = excluded.data,
    size = excluded.size,
    last_access = excluded.last_access
`);
const stmtDelete = sqlite.prepare("DELETE FROM image_blobs WHERE url = ?");
const stmtStats = sqlite.prepare(
  "SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM image_blobs",
);
const stmtOldest = sqlite.prepare(
  "SELECT url, size FROM image_blobs ORDER BY last_access ASC LIMIT ?",
);

let insertsSinceCheck = 0;

export function getImageBlob(url: string): Uint8Array | null {
  try {
    const row = stmtGet.get(url) as
      | { data: Uint8Array; last_access: number }
      | undefined;
    if (!row) return null;

    const now = Date.now();
    if (now - row.last_access > TOUCH_INTERVAL_MS) {
      stmtTouch.run(now, url);
    }
    return row.data;
  } catch (error) {
    console.error("ImageBlobStore: read error:", error);
    return null;
  }
}

export function setImageBlob(url: string, data: Uint8Array): void {
  try {
    const now = Date.now();
    stmtUpsert.run(url, data, data.byteLength, now, now);

    if (++insertsSinceCheck >= EVICT_CHECK_EVERY) {
      insertsSinceCheck = 0;
      evictIfNeeded();
    }
  } catch (error) {
    console.error("ImageBlobStore: write error:", error);
  }
}

export function deleteImageBlob(url: string): void {
  try {
    stmtDelete.run(url);
  } catch (error) {
    console.error("ImageBlobStore: delete error:", error);
  }
}

export function getImageBlobStats(): { count: number; bytes: number } {
  try {
    const row = stmtStats.get() as { count: number; bytes: number };
    return { count: Number(row.count), bytes: Number(row.bytes) };
  } catch {
    return { count: 0, bytes: 0 };
  }
}

/** Removes least-recently-used images until total size is under the target. */
export function evictIfNeeded(): void {
  try {
    let { bytes } = getImageBlobStats();
    if (bytes <= MAX_BYTES) return;

    const target = MAX_BYTES * EVICT_TARGET_RATIO;
    sqlite.exec("BEGIN");
    try {
      while (bytes > target) {
        const batch = stmtOldest.all(200) as Array<
          { url: string; size: number }
        >;
        if (batch.length === 0) break;
        for (const row of batch) {
          stmtDelete.run(row.url);
          bytes -= Number(row.size);
          if (bytes <= target) break;
        }
      }
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }

    // Return freed pages to the OS
    sqlite.exec("PRAGMA incremental_vacuum;");
  } catch (error) {
    console.error("ImageBlobStore: eviction error:", error);
  }
}

