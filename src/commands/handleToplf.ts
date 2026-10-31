import toplfTemplate from "@/commands/templates/toplfTemplate.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import renderCanvas from "@/rendering/renderCanvas.ts";
import runWithCollageQueue from "@/services/collageQueue.ts";
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
import { InputFile } from "grammy";

export function parseTopArgs(rawText: string): {
  period: LastfmPeriod;
  isHd: boolean;
} {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);
  const periodArg = parts.find((arg) =>
    (acceptedPeriods as readonly string[]).includes(arg),
  );
  // Default is last 7 days (7day)
  const period: LastfmPeriod = periodArg ? periodMap[periodArg] : "7day";
  const isHd = hasHdParam(rawText);

  return { period, isHd };
}

export default async function handleToplf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("toplf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const { period, isHd } = parseTopArgs(ctx.message?.text || "");
    const periodLabel = periodInTextMap[period] || "last 7 days";

    const tip = new FormattedString(
      `Generating your top artists, albums, and scrobbles (${periodLabel})...\n\n`,
    )
      .bold("⏰ It may take a while\n\n")
      .italic("💡 Tip: you can customize the period (7d, 1m, 3m, 6m, 1y, all):\n\n")
      .plain("➡️ Examples:\n")
      .code("/toplf")
      .plain("\n")
      .code("/toplf 1m")
      .plain("\n")
      .code("/toplf all hd");

    await runWithCollageQueue(ctx, tip, async () => {
      const profileData = await getUserProfileData(lastfm_user, period);

      await ctx.replyWithChatAction(isHd ? "upload_document" : "upload_photo");

      const template = toplfTemplate({
        profileData,
        period,
      });

      const canvasBuffer = await renderCanvas(template);

      const displayName = ctx.from?.first_name || ctx.from?.username || "User";
      const caption = `${displayName}, your tops of the ${periodLabel}`;

      const ext = template.format === "png" ? "png" : "jpg";
      const filename = `top_${profileData.username}_${period}.${ext}`;

      if (isHd) {
        await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
          caption,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
      } else {
        const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
        if (canvasBuffer.byteLength > MAX_PHOTO_BYTES) {
          await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
            caption,
            reply_parameters: ctx.message
              ? { message_id: ctx.message.message_id }
              : undefined,
          });
        } else {
          await ctx.replyWithPhoto(new InputFile(canvasBuffer, filename), {
            caption,
            reply_parameters: ctx.message
              ? { message_id: ctx.message.message_id }
              : undefined,
          });
        }
      }
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

