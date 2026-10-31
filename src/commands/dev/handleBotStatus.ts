import config from "@/config.ts";
import {
  type DailyUsageStats,
  getCommandRankByDateRange,
  getUsageStatsByDateRange,
} from "@/database/services/commandLogs.ts";
import { getImageBlobStats } from "@/database/imageBlobStore.ts";
import { countCachedImages } from "@/database/services/imageCache.ts";
import { countUsers } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import { getCollageQueueStatus } from "@/services/collageQueue.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import process from "node:process";

const startTime = Date.now();

function formatUptime(uptimeMs: number): string {
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}min`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function parseDateArg(arg: string): Date | null {
  const trimmed = arg.trim();

  // Format DD/MM/YYYY
  const brMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10) - 1;
    const year = parseInt(brMatch[3], 10);
    const parsed = new Date(year, month, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  // Format YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const parsed = new Date(year, month, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  return null;
}

function appendStatsBlock(
  builder: FormattedString,
  title: string,
  stats: DailyUsageStats,
): FormattedString {
  return builder
    .bold(`${title}\n`)
    .plain(` • Commands: ${stats.totalCommands.toLocaleString("pt-BR")}\n`)
    .plain(` • Unique Users: ${stats.uniqueUsers.toLocaleString("pt-BR")}\n`)
    .plain(` • Private Chats: ${stats.privateChats.toLocaleString("pt-BR")}\n`)
    .plain(` • Groups: ${stats.groupChats.toLocaleString("pt-BR")}\n\n`);
}

function appendCommandRankBlock(
  builder: FormattedString,
  ranks: { command: string; count: number }[],
): FormattedString {
  let updated = builder.bold("🏆 Command Usage Rank:\n");

  if (ranks.length === 0) {
    return updated.plain(" • No commands executed on this date.\n");
  }

  for (const r of ranks) {
    updated = updated
      .plain(" • ")
      .code(`/${r.command}`)
      .plain(`: ${r.count.toLocaleString("pt-BR")}\n`);
  }

  return updated;
}

export default async function handleBotStatus(ctx: BotContext) {
  const telegram_id = ctx.from?.id;

  if (!telegram_id) {
    return;
  }

  if (!config.bot.devs.includes(telegram_id.toString())) {
    return;
  }

  try {
    await ctx.replyWithChatAction("typing");

    const rawText = ctx.message?.text || "";
    const parts = rawText.trim().split(/\s+/).slice(1);
    const dateArg = parts[0];

    if (dateArg) {
      const parsedDate = parseDateArg(dateArg);
      if (!parsedDate) {
        const errorMsg = new FormattedString("⚠️ Invalid date format.\n\n")
          .plain("Use format ")
          .code("DD/MM/YYYY")
          .plain(" (e.g. ")
          .code("/botstatuslf 23/10/2026")
          .plain(")");

        await ctx.reply(errorMsg.text, {
          entities: errorMsg.entities,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
        return;
      }

      const { startIso, endIso } = getDayRange(parsedDate);
      const [stats, rank] = await Promise.all([
        getUsageStatsByDateRange(startIso, endIso),
        getCommandRankByDateRange(startIso, endIso),
      ]);

      const formattedDate = parsedDate.toLocaleDateString("pt-BR");
      let msg = new FormattedString(`🔍 BOT STATUS • ${formattedDate} 🔍\n\n`);

      msg = appendStatsBlock(msg, `📊 Usage on ${formattedDate}:`, stats);
      msg = appendCommandRankBlock(msg, rank);

      await ctx.reply(msg.text, {
        entities: msg.entities,
        reply_parameters: ctx.message
          ? { message_id: ctx.message.message_id }
          : undefined,
      });
      return;
    }

    // Default overview (Today + Yesterday + Server Info)
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayRange = getDayRange(now);
    const yesterdayRange = getDayRange(yesterday);

    const [usersCount, cachedImagesCount, todayStats, yesterdayStats] =
      await Promise.all([
        countUsers(),
        countCachedImages(),
        getUsageStatsByDateRange(todayRange.startIso, todayRange.endIso),
        getUsageStatsByDateRange(
          yesterdayRange.startIso,
          yesterdayRange.endIso,
        ),
      ]);

    const uptime = formatUptime(Date.now() - startTime);
    const memoryRssMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const blobStats = getImageBlobStats();
    const blobSizeMb = (blobStats.bytes / 1024 / 1024).toFixed(1);
    const botName = config.bot.username
      ? `@${config.bot.username.replace("@", "")}`
      : "telelastfm";

    let msg = new FormattedString("🔍 BOT OVERVIEW 🔍\n")
      .plain(`🤖 ${botName}\n`)
      .plain(
        `👥 Total Registered Users: ${usersCount.toLocaleString("pt-BR")}\n`,
      )
      .plain(
        `🖼️ Cached Image Links: ${cachedImagesCount.toLocaleString("pt-BR")}\n`,
      )
      .plain(
        `💾 Cached Image Files: ${
          blobStats.count.toLocaleString("pt-BR")
        } (${blobSizeMb} MB / ${config.imageCache.maxSizeMb} MB)\n\n`,
      );

    msg = appendStatsBlock(msg, "📅 Today's Usage:", todayStats);
    msg = appendStatsBlock(msg, "⏮️ Yesterday's Usage:", yesterdayStats);

    const queueStatus = getCollageQueueStatus();

    msg = msg
      .bold("🖥️ Server Health:\n")
      .plain(` • Uptime: ${uptime}\n`)
      .plain(` • Memory: ${memoryRssMb} MB\n`)
      .plain(
        ` • Collage Queue: ${queueStatus.active}/${queueStatus.maxConcurrent} active (${queueStatus.waiting} queued)\n`,
      );

    await ctx.reply(msg.text, {
      entities: msg.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

