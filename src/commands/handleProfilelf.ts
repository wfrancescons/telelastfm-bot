import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import { getUserBasicInfo } from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InlineKeyboard } from "grammy";

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

    // Single API call (user.getInfo) fetching all required metadata
    const info = await getUserBasicInfo(lastfm_user);

    const telegramName =
      [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(" ") ||
      ctx.from?.username ||
      info.realname ||
      info.username;

    const profileUrl = info.url;
    const scrobbles = info.scrobbles.toLocaleString("en-US");
    const artists = info.artistsCount.toLocaleString("en-US");
    const albums = info.albumsCount.toLocaleString("en-US");
    const tracks = info.tracksCount.toLocaleString("en-US");

    // Format message with embedded user profile link
    const msg = new FormattedString(`👤 `)
      .link(`${telegramName}'s Last.fm`, profileUrl)
      .plain(`:\n\n`)
      .plain(`🎵 `)
      .bold(`Scrobbles: `)
      .plain(`${scrobbles}\n`)
      .plain(`🎤 `)
      .bold(`Artists: `)
      .plain(`${artists}\n`)
      .plain(`💿 `)
      .bold(`Albums: `)
      .plain(`${albums}\n`)
      .plain(`🎧 `)
      .bold(`Tracks: `)
      .plain(`${tracks}`);

    const keyboard = new InlineKeyboard().url("View on Last.fm", profileUrl);

    await ctx.reply(msg.text, {
      entities: msg.entities,
      reply_markup: keyboard,
      link_preview_options: {
        is_disabled: false,
        prefer_small_media: true,
      },
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}
