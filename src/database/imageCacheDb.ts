import config from "@/config.ts";
import { DatabaseSync } from "node:sqlite";

export const imageCacheDb = new DatabaseSync(config.imageCache.path);

imageCacheDb.exec("PRAGMA auto_vacuum = INCREMENTAL;");
imageCacheDb.exec("PRAGMA journal_mode = WAL;");
imageCacheDb.exec("PRAGMA synchronous = NORMAL;");
imageCacheDb.exec("PRAGMA busy_timeout = 5000;");

