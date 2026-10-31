import { Buffer } from "node:buffer";
import profilelfTemplate from "@/commands/templates/profilelfTemplate.ts";
import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import renderCanvas from "@/rendering/renderCanvas.ts";
import { fetchWithRetry } from "@/services/lastfm/client.ts";
import { getUserProfileData } from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import {
  acceptedPeriods,
  hasHdParam,
  type LastfmPeriod,
  periodInTextMap,
  periodMap,
} from "@/utils/validValuesMap.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InlineKeyboard, InputFile } from "grammy";

export function parseProfileArgs(rawText: string): {
  period: LastfmPeriod;
  isHd: boolean;
} {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);
  const periodArg = parts.find((arg) =>
    (acceptedPeriods as readonly string[]).includes(arg),
  );
  const period: LastfmPeriod = periodArg ? periodMap[periodArg] : "overall";
  const isHd = hasHdParam(rawText);

  return { period, isHd };
}

async function getTelegramAvatarDataUri(
  ctx: BotContext,
  telegramId: number,
): Promise<string | null> {
  try {
    const photos = await ctx.api.getUserProfilePhotos(telegramId, { limit: 1 });
    const firstPhotoSizes = photos?.photos?.[0];
    if (!firstPhotoSizes || firstPhotoSizes.length === 0) {
      return null;
    }

    const bestSize = firstPhotoSizes[firstPhotoSizes.length - 1];
    const file = await ctx.api.getFile(bestSize.file_id);
    if (!file?.file_path || !config.bot.token) {
      return null;
    }

    const fileUrl = `https://api.telegram.org/file/bot${config.bot.token}/${file.file_path}`;
    const response = await fetchWithRetry(fileUrl, {}, 2, 5000);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) return null;

    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export default async function handleProfilelf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("profilelf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const { period, isHd } = parseProfileArgs(ctx.message?.text || "");
    const periodLabel = periodInTextMap[period] || period;

    const tip = new FormattedString("Generating your Last.fm profile...\n\n")
      .bold("⏰ It may take a while\n\n")
      .italic(
        "💡 Tip: you can optionally filter the top lists by period or request HD file:\n\n",
      )
      .plain("➡️ Examples:\n")
      .code("/profilelf")
      .plain("\n")
      .code("/profilelf 7d")
      .plain("\n")
      .code("/profilelf 1y hd");

    const progressMsg = await ctx.reply(tip.text, {
      entities: tip.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    let profileData;
    let fallbackAvatarUrl: string | null = null;

    try {
      profileData = await getUserProfileData(lastfm_user, period);
      if (!profileData.avatar) {
        fallbackAvatarUrl = await getTelegramAvatarDataUri(ctx, telegram_id);
      }
    } catch (err) {
      try {
        await progressMsg.delete();
      } catch {
        // Ignore if message cannot be deleted
      }
      throw err;
    }

    await ctx.replyWithChatAction(isHd ? "upload_document" : "upload_photo");

    const fallbackDisplayName =
      [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") ||
      ctx.from?.username ||
      lastfm_user;

    const template = profilelfTemplate({
      profileData,
      fallbackDisplayName,
      fallbackAvatarUrl,
    });

    const canvasBuffer = await renderCanvas(template);

    const displayName = ctx.from?.first_name || ctx.from?.username || "User";
    const caption =
      period === "overall"
        ? `${displayName}, your Last.fm profile`
        : `${displayName}, your Last.fm profile (${periodLabel})`;

    const ext = template.format === "png" ? "png" : "jpg";
    const filename = `profile_${profileData.username}_${period}.${ext}`;

    const profileUrl = `https://www.last.fm/user/${encodeURIComponent(profileData.username)}`;
    const keyboard = new InlineKeyboard().url(
      "View on Last.fm",
      profileUrl,
    );

    if (isHd) {
      await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
        caption,
        reply_markup: keyboard,
        reply_parameters: ctx.message
          ? { message_id: ctx.message.message_id }
          : undefined,
      });
    } else {
      const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
      if (canvasBuffer.byteLength > MAX_PHOTO_BYTES) {
        await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
          caption,
          reply_markup: keyboard,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
      } else {
        await ctx.replyWithPhoto(new InputFile(canvasBuffer, filename), {
          caption,
          reply_markup: keyboard,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
      }
    }

    try {
      await progressMsg.delete();
    } catch {
      // Ignore if message cannot be deleted
    }
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

