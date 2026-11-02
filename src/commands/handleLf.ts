import formatLf from "@/commands/formatters/formatLf.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import { getTrackListeningNow } from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";

export default async function handleLf(ctx: BotContext) {
  let telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("lf", telegram_id, chat_id);

  let first_name = ctx.from?.first_name || ctx.from?.username || "User";
  let reply_to_message_id = ctx.message?.message_id;

  const replyMsg = ctx.message?.reply_to_message;
  const isReplyToChannel = replyMsg?.sender_chat?.type === "channel";

  if (replyMsg?.from && !isReplyToChannel) {
    telegram_id = replyMsg.from.id;
    first_name = replyMsg.from.first_name || replyMsg.from.username || "User";
    reply_to_message_id = replyMsg.message_id;
  }

  try {
    ctx.replyWithChatAction("typing").catch(() => {});

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const lastfm_data = await getTrackListeningNow(lastfm_user);

    const message = formatLf({
      first_name,
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

