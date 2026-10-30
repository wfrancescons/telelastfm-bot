import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

const AUTO_DELETE_TIMEOUT_MS = 10000;

function scheduleDelete(
  ctx: BotContext,
  chatId: number,
  messageId: number,
  delayMs = AUTO_DELETE_TIMEOUT_MS,
) {
  setTimeout(async () => {
    try {
      await ctx.api.deleteMessage(chatId, messageId);
    } catch {
      // Silently ignore if already deleted or without permission
    }
  }, delayMs);
}

export default async function handleUserInfo(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  // Check if user is dev
  if (!config.bot.devs.includes(telegram_id.toString())) {
    return;
  }

  logCommand("userinfolf", telegram_id, chat_id);

  try {
    const replyMessage = ctx.message?.reply_to_message;
    const targetUser = replyMessage?.from;

    // In case no user message was replied to
    if (!replyMessage || !targetUser) {
      const warning = new FormattedString(
        "⚠️ Please reply to a user's message with ",
      )
        .code("/userinfolf")
        .plain(" to check their information.\n\n")
        .italic("⏱️ This message will be deleted in 10 seconds.");

      const sent = await ctx.reply(warning.text, {
        entities: warning.entities,
        reply_parameters: ctx.message
          ? { message_id: ctx.message.message_id }
          : undefined,
      });

      scheduleDelete(ctx, chat_id, sent.message_id);
      return;
    }

    const targetTelegramId = targetUser.id;
    const user = await getUser(targetTelegramId);

    const fullName = [targetUser.first_name, targetUser.last_name]
      .filter(Boolean)
      .join(" ");
    const usernameTag = targetUser.username ? ` (@${targetUser.username})` : "";

    let info = new FormattedString("👤 ")
      .bold("User Information:\n\n")
      .plain("• ")
      .bold("Name: ")
      .plain(`${fullName}${usernameTag}\n`)
      .plain("• ")
      .bold("Telegram ID: ")
      .code(targetTelegramId.toString())
      .plain("\n• ")
      .bold("Last.fm: ");

    if (user?.lastfm_username) {
      info = info.code(user.lastfm_username).plain("\n\n");
    } else {
      info = info.italic("Not registered\n\n");
    }

    info = info.italic("⏱️ This message will be deleted in 10 seconds.");

    const profileUrl = user?.lastfm_username
      ? `https://www.last.fm/user/${encodeURIComponent(user.lastfm_username)}`
      : null;

    const replyMarkup = profileUrl
      ? {
        inline_keyboard: [
          [
            {
              text: "Open on Last.fm",
              url: profileUrl,
            },
          ],
        ],
      }
      : undefined;

    const sent = await ctx.reply(info.text, {
      entities: info.entities,
      reply_markup: replyMarkup,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });

    scheduleDelete(ctx, chat_id, sent.message_id);
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

