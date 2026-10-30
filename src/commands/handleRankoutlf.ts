import { logCommand } from "@/database/services/commandLogs.ts";
import { deleteRecord } from "@/database/services/rankGroupParticipants.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handleRankoutlf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("rankoutlf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    if (chat_id > 0) {
      throw "RANK_PERSONAL_CHAT";
    }

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const deleted = await deleteRecord(chat_id, telegram_id);
    if (!deleted) {
      throw "RANK_USER_NOT_FOUND";
    }

    const msg = new FormattedString("OK, you're out of ")
      .bold("Weekly Chart Race!")
      .plain(" 🎶🏃‍♂️\n\nUse /rankinlf to join again.");

    await ctx.reply(msg.text, {
      entities: msg.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

