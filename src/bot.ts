import process from "node:process";
import config from "@/config.ts";
import { initDatabase } from "@/database/schema.ts";
import type { BotContext } from "@/types/context.ts";
import { commands } from "@grammyjs/commands";
import { hydrate } from "@grammyjs/hydrate";
import { run } from "@grammyjs/runner";
import { Bot, GrammyError, HttpError } from "grammy";

import setupBotProfile from "@/botProfile.ts";
import handleInlineQuery from "@/commands/handleInlineQuery.ts";
import { devCommands, userCommands } from "@/commands/index.ts";
import startCronJob from "@/cron/cronjob.ts";
import ignoreChannelMessages from "@/middlewares/ignoreChannelMessages.ts";
import safeReplyTransformer from "@/middlewares/safeReplyTransformer.ts";
import throttleCommands from "@/middlewares/throttleCommands.ts";

const bot = new Bot<BotContext>(config.bot.token);

let runner: ReturnType<typeof run> | null = null;
let cronJob: ReturnType<typeof startCronJob> | null = null;
let isStopping = false;

async function handleShutdown(signal: string) {
  if (isStopping) {
    console.log("BOT: force exiting...");
    process.exit(1);
  }
  isStopping = true;
  console.log(`BOT: stopping on ${signal}`);

  const fallbackTimer = setTimeout(() => {
    process.exit(0);
  }, 2000);

  try {
    if (typeof fallbackTimer.unref === "function") {
      fallbackTimer.unref();
    }
  } catch {
    // Ignore if unref is unavailable
  }

  try {
    if (cronJob) {
      cronJob.stop();
    }
    if (runner && runner.isRunning()) {
      await runner.stop();
    }
  } catch (err) {
    console.error("BOT: error while stopping runner:", err);
  } finally {
    clearTimeout(fallbackTimer);
    process.exit(0);
  }
}

try {
  console.log("BOT: starting components");

  // Initialize local SQLite database
  await initDatabase();
  console.log("BOT: database initialized");

  // Global unhandled error handler
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`BOT: Error while handling update ${ctx.update.update_id}:`);

    const e = err.error;
    if (e instanceof GrammyError) {
      console.error(
        `BOT: Telegram API error (${e.error_code}): ${e.description}`,
      );
    } else if (e instanceof HttpError) {
      console.error(
        "BOT: Network connection error contacting Telegram:",
        e.message,
      );
    } else {
      console.error("BOT: Unhandled middleware error:", e);
    }
  });

  // Global API transformers and plugins
  bot.api.config.use(safeReplyTransformer);
  bot.use(hydrate());
  bot.use(commands());
  bot.use(ignoreChannelMessages);
  bot.use(throttleCommands);

  // Register command groups (@grammyjs/commands)
  bot.use(devCommands);
  bot.use(userCommands);

  // Inline mode
  bot.on("inline_query", handleInlineQuery);

  // Initialize bot info
  await bot.init();
  console.log(
    `BOT: running as @${bot.botInfo.username} in ${config.environment} environment`,
  );

  // Setup commands and descriptions in Telegram in background
  setupBotProfile(bot).catch((err) => {
    console.error("BOT: Error running setupBotProfile:", err);
  });

  // Schedule Weekly Chart Race cron job
  cronJob = startCronJob(bot);

  // Start concurrent update processing using grammY runner with default settings
  runner = run(bot);

  try {
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch {
    // Signal may not be supported in all environments
  }

  try {
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch {
    // Signal may not be supported on Windows
  }
} catch (error) {
  console.error("BOT: error when starting - ", error);
}

export default bot;

