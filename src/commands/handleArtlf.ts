import formatArtlf from "@/commands/formatters/formatArtlf.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import { updateStreaks } from "@/database/services/userStreaks.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import {
  getArtistInfo,
  getArtistListeningNow,
} from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";

function extractCommandArgs(ctx: BotContext): string {
  if (typeof ctx.match === "string" && ctx.match.trim()) {
    return ctx.match.trim();
  }
  const text = ctx.message?.text || "";
  const firstSpace = text.indexOf(" ");
  return firstSpace !== -1 ? text.slice(firstSpace + 1).trim() : "";
}

export default async function handleArtlf(ctx: BotContext) {
  let telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("artlf", telegram_id, chat_id);

  let first_name = ctx.from?.first_name || ctx.from?.username || "User";
  let reply_to_message_id = ctx.message?.message_id;

  const replyMsg = ctx.message?.reply_to_message;
  const isReplyToChannel = replyMsg?.sender_chat?.type === "channel";

  if (replyMsg?.from && !isReplyToChannel) {
    telegram_id = replyMsg.from.id;
    first_name = replyMsg.from.first_name || replyMsg.from.username || "User";
    reply_to_message_id = replyMsg.message_id;
  }

  const rawArgs = extractCommandArgs(ctx);
  const hasArgs = rawArgs.length > 0;

  try {
    await ctx.replyWithChatAction("typing");

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const user_streaks = await updateStreaks(telegram_id);

    const lastfm_data = hasArgs
      ? await getArtistInfo({ artist: rawArgs, username: lastfm_user })
      : await getArtistListeningNow(lastfm_user);

    const message = formatArtlf({
      first_name,
      streaks_count: user_streaks.streaks_count,
      isCustom: hasArgs,
      ...lastfm_data,
    });

    await ctx.reply(message.text, {
      entities: message.entities,
      link_preview_options: message.link_preview_options,
      reply_parameters: reply_to_message_id
        ? { message_id: reply_to_message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

