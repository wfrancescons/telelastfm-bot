import vinyllfTemplate from "@/commands/templates/vinyllfTemplate.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import renderCanvas from "@/rendering/renderCanvas.ts";
import {
  getAlbumListeningNow,
  getArtistListeningNow,
  getTrackListeningNow,
} from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import {
  acceptedMedias,
  hasHdParam,
  mediaMap,
  type MediaType,
} from "@/utils/validValuesMap.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InputFile } from "grammy";

function parseVinylMediaArg(rawText: string): MediaType {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);
  const found = parts.find((arg) =>
    (acceptedMedias as readonly string[]).includes(arg),
  );
  return found ? mediaMap[found] : "tracks";
}

async function fetchVinylData(lastfm_user: string, media_type: MediaType) {
  if (media_type === "tracks") {
    return await getTrackListeningNow(lastfm_user);
  }
  if (media_type === "albums") {
    return await getAlbumListeningNow(lastfm_user);
  }
  return await getArtistListeningNow(lastfm_user);
}

export default async function handleVinyllf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("vinyllf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const media_type = parseVinylMediaArg(ctx.message?.text || "");
    const lastfm_data = await fetchVinylData(lastfm_user, media_type);

    const tip = new FormattedString(`Generating your ${media_type} vinyl...\n\n`)
      .bold("⏰ It may take a while\n\n")
      .italic("💡 Tip: you can define the type of media of your vinyl:\n\n")
      .plain("➡️ Examples:\n")
      .code("/vinyllf alb")
      .plain("\n")
      .code("/vinyllf art");

    const progressMsg = await ctx.reply(tip.text, {
      entities: tip.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    await ctx.replyWithChatAction("upload_photo");

    const template = vinyllfTemplate({
      lastfm_data: {
        track: "track" in lastfm_data ? lastfm_data.track : undefined,
        album: "album" in lastfm_data ? lastfm_data.album : undefined,
        artist: lastfm_data.artist,
        userplaycount: lastfm_data.userplaycount,
        image: lastfm_data.image.extralarge || lastfm_data.image.large,
        isNowPlaying: lastfm_data.isNowPlaying,
      },
      media_type,
    });

    const canvasBuffer = await renderCanvas(template);

    const displayName = ctx.from?.first_name || ctx.from?.username || "User";
    const caption = `${displayName}, your ${media_type} vinyl`;
    const isHd = hasHdParam(ctx.message?.text || "");
    const ext = template.format === "png" ? "png" : "jpg";
    const filename = `vinyl_${media_type}.${ext}`;

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

    try {
      await progressMsg.delete();
    } catch {
      // Ignore if message cannot be deleted
    }
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

