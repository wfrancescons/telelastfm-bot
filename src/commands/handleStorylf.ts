import storylfTemplate from "@/commands/templates/storylfTemplate.ts";
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
  mediaMap,
  type MediaType,
} from "@/utils/validValuesMap.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InputFile } from "grammy";

function parseStoryMediaArg(rawText: string): MediaType {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);
  const found = parts.find((arg) =>
    (acceptedMedias as readonly string[]).includes(arg),
  );
  return found ? mediaMap[found] : "tracks";
}

async function fetchStoryData(lastfm_user: string, media_type: MediaType) {
  if (media_type === "tracks") {
    return await getTrackListeningNow(lastfm_user);
  }
  if (media_type === "albums") {
    return await getAlbumListeningNow(lastfm_user);
  }
  return await getArtistListeningNow(lastfm_user);
}

export default async function handleStorylf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("storylf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const media_type = parseStoryMediaArg(ctx.message?.text || "");
    const lastfm_data = await fetchStoryData(lastfm_user, media_type);

    const tip = new FormattedString(`Generating your ${media_type} story...\n\n`)
      .bold("⏰ It may take a while\n\n")
      .italic("💡 Tip: you can define the type of media of your story:\n\n")
      .plain("➡️ Examples:\n")
      .code("/storylf alb")
      .plain("\n")
      .code("/storylf art");

    const progressMsg = await ctx.reply(tip.text, {
      entities: tip.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    await ctx.replyWithChatAction("upload_photo");

    const template = storylfTemplate({
      lastfm_data: {
        track: "track" in lastfm_data ? lastfm_data.track : undefined,
        album: "album" in lastfm_data ? lastfm_data.album : undefined,
        artist: lastfm_data.artist,
        userplaycount: lastfm_data.userplaycount,
        image: lastfm_data.image.extralarge || lastfm_data.image.large,
      },
      media_type,
    });

    const canvasBuffer = await renderCanvas(template);

    const displayName = ctx.from?.first_name || ctx.from?.username || "User";
    const caption = `${displayName}, your ${media_type} story`;

    await ctx.replyWithPhoto(new InputFile(canvasBuffer, "story.jpg"), {
      caption,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    try {
      await progressMsg.delete();
    } catch {
      // Ignore if message cannot be deleted
    }
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

