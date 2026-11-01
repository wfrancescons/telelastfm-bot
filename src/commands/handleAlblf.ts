import formatAlblf from "@/commands/formatters/formatAlblf.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import { getAlbumInfo, getAlbumListeningNow } from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";

function parseCustomAlbumArg(rawArgs: string): {
  custom_album: string;
  custom_artist: string;
} {
  const parts = rawArgs.split("-");
  if (parts.length !== 2) {
    throw "CUSTOM_ALBUM_NOT_FOUND";
  }

  const custom_album = parts[0].trim();
  const custom_artist = parts[1].trim();

  if (!custom_album || !custom_artist) {
    throw "CUSTOM_ALBUM_NOT_FOUND";
  }

  return { custom_album, custom_artist };
}

function extractCommandArgs(ctx: BotContext): string {
  if (typeof ctx.match === "string" && ctx.match.trim()) {
    return ctx.match.trim();
  }
  const text = ctx.message?.text || "";
  const firstSpace = text.indexOf(" ");
  return firstSpace !== -1 ? text.slice(firstSpace + 1).trim() : "";
}

export default async function handleAlblf(ctx: BotContext) {
  let telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("alblf", telegram_id, chat_id);

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

    let lastfm_data;
    if (hasArgs) {
      const { custom_album, custom_artist } = parseCustomAlbumArg(rawArgs);
      lastfm_data = await getAlbumInfo({
        album: custom_album,
        artist: custom_artist,
        username: lastfm_user,
      });
    } else {
      lastfm_data = await getAlbumListeningNow(lastfm_user);
    }

    const message = formatAlblf({
      first_name,
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

