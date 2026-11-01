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

export type WeeklyScrobblesPlaycountsTable = {
  telegram_id: number;
  scrobbles_playcount: number;
  tracks_playcount: number;
  consecutive_zero_weeks: number;
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

    if (
      tableExists("weekly_scrobbles_playcounts") &&
      !hasColumn("weekly_scrobbles_playcounts", "consecutive_zero_weeks")
    ) {
      sqlite.exec(
        "ALTER TABLE weekly_scrobbles_playcounts ADD COLUMN consecutive_zero_weeks INTEGER NOT NULL DEFAULT 0;",
      );
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

  await db.schema.createTable("weekly_scrobbles_playcounts")
    .ifNotExists()
    .addColumn("telegram_id", "integer", (col) => col.primaryKey().notNull())
    .addColumn("scrobbles_playcount", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("tracks_playcount", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("consecutive_zero_weeks", "integer", (col) => col.notNull().defaultTo(0))
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

