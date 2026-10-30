import formatAlblf from "@/commands/formatters/formatAlblf.ts";
import formatArtlf from "@/commands/formatters/formatArtlf.ts";
import formatLf from "@/commands/formatters/formatLf.ts";
import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import { updateStreaks } from "@/database/services/userStreaks.ts";
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

function isMessageFromThisBot(ctx: BotContext): boolean {
  const botUsername = config.bot.username.replace("@", "").toLowerCase();
  const replyUsername =
    ctx.message?.reply_to_message?.from?.username?.toLowerCase();
  return Boolean(
    (botUsername && replyUsername === botUsername) ||
      ctx.message?.reply_to_message?.from?.id === ctx.me?.id,
  );
}

function detectMediaType(line?: string): MediaType | null {
  if (!line) return null;
  if (line.startsWith("🎶")) return "tracks";
  if (line.startsWith("💿")) return "albums";
  if (line.startsWith("🧑‍🎤")) return "artists";
  return null;
}

function parseTextFromThisBot(
  lines: string[],
  mediaType: MediaType,
): { track?: string; album?: string; artist?: string } {
  if (mediaType === "tracks") {
    return {
      track: (lines[1] || "").replace("🎶 ", "").trim(),
      album: (lines[2] || "").replace("💿 ", "").trim(),
      artist: (lines[3] || "").replace("🧑‍🎤 ", "").trim(),
    };
  }

  if (mediaType === "albums") {
    return {
      album: (lines[1] || "").replace("💿 ", "").trim(),
      artist: (lines[2] || "").replace("🧑‍🎤 ", "").trim(),
    };
  }

  return {
    artist: (lines[1] || "").replace("🧑‍🎤 ", "").trim(),
  };
}

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

export default async function handleMelf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("melf", telegram_id, chat_id);

  const first_name = ctx.from?.first_name || ctx.from?.username || "User";
  const reply_to_message_id = ctx.message?.message_id;
  const rawText = ctx.message?.text || "";
  const requestedMediaType = parseMediaArg(rawText);

  const replyMsg = ctx.message?.reply_to_message;
  const isReplyToChannel = replyMsg?.sender_chat?.type === "channel";

  try {
    await ctx.replyWithChatAction("typing");

    if (!replyMsg?.from || isReplyToChannel) {
      throw "NOT_A_REPLY_MESSAGE";
    }

    if (isMessageFromThisBot(ctx)) {
      const botText = replyMsg.text;
      if (!botText) {
        throw "NOT_A_MUSIC_BOT_MESSAGE";
      }

      const lines = botText.split("\n");
      const senderLastfm = await getLastfmUser(telegram_id);
      if (!senderLastfm) {
        throw "USER_NOT_FOUND";
      }

      let mediaType = detectMediaType(lines[1]);
      if (!mediaType) {
        throw "NOT_A_MUSIC_BOT_MESSAGE";
      }

      const userStreaks = await updateStreaks(telegram_id);
      const parsedInfo = parseTextFromThisBot(lines, mediaType);

      const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);
      const lastArg = parts[parts.length - 1];
      const mappedArg = lastArg ? mediaMap[lastArg] : undefined;

      if (mappedArg) {
        if (mediaType === "tracks") {
          mediaType = mappedArg;
        } else if (
          mediaType === "albums" &&
          (mappedArg === "albums" || mappedArg === "artists")
        ) {
          mediaType = mappedArg;
        }
      }

      const lastfmData = await getScrobblesData({
        lastfm_user: senderLastfm,
        media_type: mediaType,
        ...parsedInfo,
      });

      const formatted = formatByMediaType(
        {
          first_name,
          streaks_count: userStreaks.streaks_count,
          isCustom: true,
          ...lastfmData,
        },
        mediaType,
      );

      await ctx.reply(formatted.text, {
        entities: formatted.entities,
        link_preview_options: formatted.link_preview_options,
        reply_parameters: reply_to_message_id
          ? { message_id: reply_to_message_id }
          : undefined,
      });
      return;
    }

    const senderLastfm = await getLastfmUser(telegram_id);
    if (!senderLastfm) {
      throw "USER_NOT_FOUND";
    }

    const replyLastfm = await getLastfmUser(replyMsg.from.id);
    if (!replyLastfm) {
      throw "USER_NOT_FOUND_REPLY";
    }

    const userStreaks = await updateStreaks(telegram_id);
    const replyData = await getListeningNowByType(
      replyLastfm,
      requestedMediaType,
    );
    const senderData = await getScrobblesData({
      lastfm_user: senderLastfm,
      media_type: requestedMediaType,
      ...replyData,
    });

    const formatted = formatByMediaType(
      {
        first_name,
        streaks_count: userStreaks.streaks_count,
        isCustom: true,
        ...senderData,
      },
      requestedMediaType,
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

