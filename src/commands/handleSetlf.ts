import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { setLastfmUsername } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import { getLastfmUserData } from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handleSetlf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("setlf", telegram_id, chat_id);

  let targetUsername = typeof ctx.match === "string" ? ctx.match.trim() : "";

  if (!targetUsername && ctx.message?.text) {
    const parts = ctx.message.text.trim().split(/\s+/);
    if (parts.length > 1) {
      targetUsername = parts[1].trim();
    }
  }

  try {
    if (!targetUsername) {
      throw "REG_WITHOUT_ARGS";
    }

    ctx.replyWithChatAction("typing").catch(() => {});

    try {
      await getLastfmUserData(targetUsername);
    } catch {
      throw "NOT_A_VALID_LASTFM_USER";
    }

    const user = await setLastfmUsername(telegram_id, targetUsername);
    if (!user) {
      throw new Error("COMMON_ERROR");
    }

    let message = new FormattedString("")
      .bold(targetUsername)
      .plain(
        " set as your Last.fm username ✅\n\nBy using this bot, you agree to our Terms of Use and Privacy Policy available at /privacy\n",
      );

    if (config.bot.news_channel) {
      message = message.plain(
        `\n➡️ Access ${config.bot.news_channel} for news and server status\n`,
      );
    }

    message = message.plain(
      "\nOn Letterboxd? 🟠🟢🔵 Give @letterboxdgrambot a try",
    );

    await ctx.reply(message.text, {
      entities: message.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error, targetUsername);
  }
}

