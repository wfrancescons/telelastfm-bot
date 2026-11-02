import { logCommand } from "@/database/services/commandLogs.ts";
import { findOrCreateRecord } from "@/database/services/rankGroupParticipants.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import { resetUserZeroWeeks } from "@/database/services/weeklyScrobblesPlaycount.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handleRankinlf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("rankinlf", telegram_id, chat_id);

  try {
    ctx.replyWithChatAction("typing").catch(() => {});

    if (chat_id > 0) {
      throw "RANK_PERSONAL_CHAT";
    }

    const isForum = Boolean(
      (ctx.chat as { is_forum?: boolean })?.is_forum ||
        ctx.message?.is_topic_message ||
        ctx.message?.message_thread_id,
    );

    if (isForum) {
      throw "RANK_TOPIC_GROUP";
    }

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const newRecord = await findOrCreateRecord(chat_id, telegram_id);
    if (!newRecord) {
      throw "COMMON_ERROR";
    }

    await resetUserZeroWeeks(telegram_id);

    const msg = new FormattedString("You're in the group ")
      .bold("Weekly Chart Race!")
      .plain(" 🎶🏃‍♂️");

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

