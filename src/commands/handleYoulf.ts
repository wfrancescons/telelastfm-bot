import formatAlblf from "@/commands/formatters/formatAlblf.ts";
import formatArtlf from "@/commands/formatters/formatArtlf.ts";
import formatLf from "@/commands/formatters/formatLf.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import {
  getAlbumInfo,
  getAlbumListeningNow,
  getArtistInfo,
  getArtistListeningNow,
  getTrackInfo,
  getTrackListeningNow,
} from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import {
  acceptedMedias,
  mediaMap,
  type MediaType,
} from "@/utils/validValuesMap.ts";

async function getScrobblesData({
  lastfm_user,
  media_type,
  track,
  album,
  artist,
}: {
  lastfm_user: string;
  media_type: MediaType;
  track?: string;
  album?: string;
  artist?: string;
}) {
  if (media_type === "tracks") {
    return await getTrackInfo({
      track: track || "",
      artist: artist || "",
      username: lastfm_user,
    });
  }

  if (media_type === "albums") {
    return await getAlbumInfo({
      album: album || "",
      artist: artist || "",
      username: lastfm_user,
    });
  }

  return await getArtistInfo({
    artist: artist || "",
    username: lastfm_user,
  });
}

async function getListeningNowByType(
  lastfm_user: string,
  media_type: MediaType,
) {
  if (media_type === "tracks") {
    return await getTrackListeningNow(lastfm_user);
  }
  if (media_type === "albums") {
    return await getAlbumListeningNow(lastfm_user);
  }
  return await getArtistListeningNow(lastfm_user);
}

// deno-lint-ignore no-explicit-any
function formatByMediaType(data: any, media_type: MediaType) {
  if (media_type === "tracks") return formatLf(data);
  if (media_type === "albums") return formatAlblf(data);
  return formatArtlf(data);
}

function parseMediaArg(rawText: string): MediaType {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);
  const found = parts.find((arg) =>
    (acceptedMedias as readonly string[]).includes(arg),
  );
  return found ? mediaMap[found] : "tracks";
}

export default async function handleYoulf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("youlf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const replyMsg = ctx.message?.reply_to_message;
    const isReplyToChannel = replyMsg?.sender_chat?.type === "channel";

    if (!replyMsg?.from || isReplyToChannel) {
      throw "NOT_A_REPLY_MESSAGE";
    }

    const first_name =
      replyMsg.from.first_name || replyMsg.from.username || "User";
    const reply_to_message_id = replyMsg.message_id;
    const media_type = parseMediaArg(ctx.message?.text || "");
    const reply_user_telegram_id = replyMsg.from.id;

    const sender_lastfm_user = await getLastfmUser(telegram_id);
    if (!sender_lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const reply_lastfm_user = await getLastfmUser(reply_user_telegram_id);
    if (!reply_lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const sender_lastfm_data = await getListeningNowByType(
      sender_lastfm_user,
      media_type,
    );

    const reply_lastfm_data = await getScrobblesData({
      lastfm_user: reply_lastfm_user,
      media_type,
      ...sender_lastfm_data,
    });

    const formatted = formatByMediaType(
      {
        first_name,
        isCustom: true,
        ...reply_lastfm_data,
      },
      media_type,
    );

    await ctx.reply(formatted.text, {
      entities: formatted.entities,
      link_preview_options: formatted.link_preview_options,
      reply_parameters: reply_to_message_id
        ? { message_id: reply_to_message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

