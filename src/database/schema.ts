import { DatabaseSync } from "node:sqlite";
import { type Generated, Kysely } from "kysely";
import config from "@/config.ts";
import { NodeSqliteDialect } from "./dialect.ts";

export type UsersTable = {
  telegram_id: number;
  lastfm_username: string;
  created_at: string;
  updated_at: string;
};

export type CommandUsageLogsTable = {
  id: Generated<number>;
  telegram_id: number;
  chat_id: number;
  command: string;
  timestamp: string;
};

export type UserStreaksTable = {
  telegram_id: number;
  streaks_count: number;
  streaks_peak: number;
  last_streak_timestamp: string;
  created_at: string;
};

export type WeeklyScrobblesPlaycountsTable = {
  telegram_id: number;
  scrobbles_playcount: number;
  tracks_playcount: number;
  created_at: string;
  updated_at: string;
};

export type RankGroupParticipantsTable = {
  id: Generated<number>;
  chat_id: number;
  telegram_id: number;
  created_at: string;
  updated_at: string;
};

export type ImageCacheTable = {
  cache_key: string;
  media_type: string;
  image_url: string;
  updated_at: string;
};

export type DatabaseSchema = {
  users: UsersTable;
  command_usage_logs: CommandUsageLogsTable;
  user_streaks: UserStreaksTable;
  weekly_scrobbles_playcounts: WeeklyScrobblesPlaycountsTable;
  rank_group_participants: RankGroupParticipantsTable;
  image_cache: ImageCacheTable;
};

const sqlite = new DatabaseSync(config.database.path);

// Configure SQLite for high concurrency and avoid locks
sqlite.exec("PRAGMA busy_timeout = 5000;");
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA synchronous = NORMAL;");

export const db = new Kysely<DatabaseSchema>({
  dialect: new NodeSqliteDialect(sqlite),
});

function tableExists(tableName: string): boolean {
  const row = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND LOWER(name) = LOWER(?)",
  ).get(tableName) as { name?: string } | undefined;
  return Boolean(row?.name);
}

function hasColumn(tableName: string, columnName: string): boolean {
  try {
    const cols = sqlite.prepare(`PRAGMA table_info("${tableName}")`).all() as Array<{ name: string }>;
    return cols.some((c) => c.name.toLowerCase() === columnName.toLowerCase());
  } catch {
    return false;
  }
}

function migrateLegacyTables(): void {
  try {
    if (tableExists("users")) {
      if (hasColumn("users", "createdAt") && !hasColumn("users", "created_at")) {
        sqlite.exec("ALTER TABLE users RENAME COLUMN createdAt TO created_at;");
      }
      if (hasColumn("users", "updatedAt") && !hasColumn("users", "updated_at")) {
        sqlite.exec("ALTER TABLE users RENAME COLUMN updatedAt TO updated_at;");
      }
    }

    if (tableExists("Users_backup")) {
      sqlite.exec("DROP TABLE IF EXISTS Users_backup;");
    }

    if (tableExists("users_backup")) {
      sqlite.exec("DROP TABLE IF EXISTS users_backup;");
    }

    if (tableExists("CommandUsageLogs")) {
      sqlite.exec(`
        INSERT OR IGNORE INTO command_usage_logs (id, telegram_id, chat_id, command, timestamp)
        SELECT id, telegram_id, chat_id, command, COALESCE(timestamp, datetime('now'))
        FROM CommandUsageLogs;
      `);
      sqlite.exec("DROP TABLE IF EXISTS CommandUsageLogs;");
    }

    if (tableExists("UserStreaks")) {
      sqlite.exec(`
        INSERT OR IGNORE INTO user_streaks (telegram_id, streaks_count, streaks_peak, last_streak_timestamp, created_at)
        SELECT telegram_id, COALESCE(streaks_count, 0), COALESCE(streaks_peak, 0), COALESCE(last_streak_timestamp, datetime('now')), COALESCE(timestamp, datetime('now'))
        FROM UserStreaks;
      `);
      sqlite.exec("DROP TABLE IF EXISTS UserStreaks;");
    }

    if (tableExists("WeeklyScrobblesPlaycounts")) {
      sqlite.exec(`
        INSERT OR IGNORE INTO weekly_scrobbles_playcounts (telegram_id, scrobbles_playcount, tracks_playcount, created_at, updated_at)
        SELECT telegram_id, COALESCE(scrobbles_playcount, 0), COALESCE(tracks_playcount, 0), COALESCE(createdAt, datetime('now')), COALESCE(updatedAt, datetime('now'))
        FROM WeeklyScrobblesPlaycounts;
      `);
      sqlite.exec("DROP TABLE IF EXISTS WeeklyScrobblesPlaycounts;");
    }

    if (tableExists("RankGroupParticipants")) {
      sqlite.exec(`
        INSERT OR IGNORE INTO rank_group_participants (id, chat_id, telegram_id, created_at, updated_at)
        SELECT id, chat_id, telegram_id, COALESCE(createdAt, datetime('now')), COALESCE(updatedAt, datetime('now'))
        FROM RankGroupParticipants;
      `);
      sqlite.exec("DROP TABLE IF EXISTS RankGroupParticipants;");
    }

    if (tableExists("image_cache")) {
      sqlite.exec(`
        UPDATE image_cache
        SET image_url = REPLACE(image_url, 'lastfm-img.freetls.fastly.net', 'lastfm.freetls.fastly.net')
        WHERE image_url LIKE '%lastfm-img.freetls.fastly.net%';
      `);
    }
  } catch (err) {
    console.error("DB: Warning during legacy table migration:", err);
  }
}

export async function initDatabase(): Promise<void> {
  await db.schema.createTable("users")
    .ifNotExists()
    .addColumn("telegram_id", "integer", (col) => col.primaryKey().notNull())
    .addColumn("lastfm_username", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) => col.notNull())
    .addColumn("updated_at", "text", (col) => col.notNull())
    .execute();

  await db.schema.createTable("command_usage_logs")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("telegram_id", "integer", (col) => col.notNull())
    .addColumn("chat_id", "integer", (col) => col.notNull())
    .addColumn("command", "text", (col) => col.notNull())
    .addColumn("timestamp", "text", (col) => col.notNull())
    .execute();

  await db.schema.createIndex("idx_command_usage_logs_timestamp")
    .ifNotExists()
    .on("command_usage_logs")
    .column("timestamp")
    .execute();

  await db.schema.createTable("user_streaks")
    .ifNotExists()
    .addColumn("telegram_id", "integer", (col) => col.primaryKey().notNull())
    .addColumn("streaks_count", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("streaks_peak", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("last_streak_timestamp", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) => col.notNull())
    .execute();

  await db.schema.createTable("weekly_scrobbles_playcounts")
    .ifNotExists()
    .addColumn("telegram_id", "integer", (col) => col.primaryKey().notNull())
    .addColumn("scrobbles_playcount", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("tracks_playcount", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "text", (col) => col.notNull())
    .addColumn("updated_at", "text", (col) => col.notNull())
    .execute();

  await db.schema.createTable("rank_group_participants")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("chat_id", "integer", (col) => col.notNull())
    .addColumn("telegram_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "text", (col) => col.notNull())
    .addColumn("updated_at", "text", (col) => col.notNull())
    .execute();

  await db.schema.createIndex("idx_rank_group_participants_chat_user")
    .ifNotExists()
    .on("rank_group_participants")
    .columns(["chat_id", "telegram_id"])
    .unique()
    .execute();

  await db.schema.createTable("image_cache")
    .ifNotExists()
    .addColumn("cache_key", "text", (col) => col.primaryKey().notNull())
    .addColumn("media_type", "text", (col) => col.notNull())
    .addColumn("image_url", "text", (col) => col.notNull())
    .addColumn("updated_at", "text", (col) => col.notNull())
    .execute();

  await db.schema.createIndex("idx_image_cache_updated_at")
    .ifNotExists()
    .on("image_cache")
    .column("updated_at")
    .execute();

  migrateLegacyTables();
}

