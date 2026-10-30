import process from "node:process";
import { load } from "@std/dotenv";

const env = await load();

function getEnv(key: string, fallback = ""): string {
  return process.env[key] || env[key] || fallback;
}

const devUsersRaw = getEnv("TELEGRAM_ADMIN_USER") || getEnv("BOT_DEVELOPER");
const devUsers = devUsersRaw
  ? devUsersRaw.split(",").map((id) => id.trim()).filter(Boolean)
  : [];

const rawDbPath = getEnv("DATABASE_PATH") || getEnv("DB_DATABASE");
const dbPath = rawDbPath && (rawDbPath.endsWith(".sqlite") || rawDbPath.endsWith(".db"))
  ? rawDbPath
  : "./database.sqlite";

const config = {
  environment: getEnv("DENO_ENV") || getEnv("NODE_ENV", "development"),
  lastfm_token: getEnv("LASTFM_TOKEN_API") || getEnv("LASTFM_API_KEY"),
  bot: {
    token: getEnv("BOT_TOKEN") || getEnv("TELEGRAM_BOT_TOKEN"),
    username: getEnv("BOT_USERNAME") || getEnv("TELEGRAM_BOT_USERNAME"),
    news_channel: getEnv("TELEGRAM_NEWS_CHANNEL") || getEnv("NEWS_CHANNEL"),
    support_chat: getEnv("TELEGRAM_SUPPORT_CHAT") || getEnv("SUPPORT_CHAT"),
    devs: devUsers,
  },
  database: {
    path: dbPath,
  },
} as const;

export default config;

