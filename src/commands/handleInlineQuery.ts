import formatAlblf from "@/commands/formatters/formatAlblf.ts";
import formatArtlf from "@/commands/formatters/formatArtlf.ts";
import formatLf from "@/commands/formatters/formatLf.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import { updateStreaks } from "@/database/services/userStreaks.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import {
  getAlbumListeningNow,
  getArtistListeningNow,
  getTrackListeningNow,
} from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import limitText from "@/utils/limitText.ts";
import type { InlineQueryResultArticle } from "grammy/types";

export default async function handleInlineQuery(ctx: BotContext) {
  const inlineQuery = ctx.inlineQuery;
  if (!inlineQuery) {
    return;
  }

  const telegram_id = inlineQuery.from.id;
  const first_name =
    inlineQuery.from.first_name || inlineQuery.from.username || "User";

  logCommand("inline_query", telegram_id, telegram_id);

  try {
    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const [user_streaks, lf, alblf, artlf] = await Promise.all([
      updateStreaks(telegram_id),
      getTrackListeningNow(lastfm_user),
      getAlbumListeningNow(lastfm_user),
      getArtistListeningNow(lastfm_user),
    ]);

    const lfMessage = formatLf({
      first_name,
      streaks_count: user_streaks.streaks_count,
      ...lf,
    });

    const alblfMessage = formatAlblf({
      first_name,
      streaks_count: user_streaks.streaks_count,
      ...alblf,
    });

    const artlfMessage = formatArtlf({
      first_name,
      streaks_count: user_streaks.streaks_count,
      ...artlf,
    });

    const trackPlays = lf.userplaycount + 1;
    const albumPlays = alblf.userplaycount + 1;
    const artistPlays = artlf.userplaycount + 1;

    const results: InlineQueryResultArticle[] = [
      {
        type: "article",
        id: "inline-track-1",
        title: "Track:",
        description:
          `🎶 ${limitText(lf.track, 20)}\n` +
          `📈 ${trackPlays.toLocaleString("pt-BR")} ${
            trackPlays !== 1 ? "scrobbles so far" : "scrobble so far"
          }`,
        thumbnail_url: lf.image.medium,
        input_message_content: {
          message_text: lfMessage.text,
          entities: lfMessage.entities,
          link_preview_options: lfMessage.link_preview_options,
        },
      },
      {
        type: "article",
        id: "inline-album-2",
        title: "Album:",
        description:
          `💿 ${limitText(alblf.album, 20)}\n` +
          `📈 ${albumPlays.toLocaleString("pt-BR")} ${
            albumPlays !== 1 ? "scrobbles so far" : "scrobble so far"
          }`,
        thumbnail_url: alblf.image.medium,
        input_message_content: {
          message_text: alblfMessage.text,
          entities: alblfMessage.entities,
          link_preview_options: alblfMessage.link_preview_options,
        },
      },
      {
        type: "article",
        id: "inline-artist-3",
        title: "Artist:",
        description:
          `🧑‍🎤 ${limitText(artlf.artist, 20)}\n` +
          `📈 ${artistPlays.toLocaleString("pt-BR")} ${
            artistPlays !== 1 ? "scrobbles so far" : "scrobble so far"
          }`,
        thumbnail_url: artlf.image.medium,
        input_message_content: {
          message_text: artlfMessage.text,
          entities: artlfMessage.entities,
          link_preview_options: artlfMessage.link_preview_options,
        },
      },
    ];

    await ctx.answerInlineQuery(results, {
      is_personal: true,
      cache_time: 0,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

