import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import type { BotContext } from "@/types/context.ts";
import { InlineKeyboard } from "grammy";

export default async function handleStart(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("start", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const firstName = ctx.from?.first_name || "there";
    const botUsername = config.bot.username.replace("@", "");

    const keyboard = new InlineKeyboard();
    if (botUsername) {
      keyboard.url(
        "💬 Add to a group",
        `https://t.me/${botUsername}?startgroup=new`,
      );
    }

    const newsLine = config.bot.news_channel
      ? `\nAccess ${config.bot.news_channel} for news and server status\n`
      : "";

    const message = `Hello, ${firstName} 👋\n` +
      `Welcome to the telelastfm bot 🔴🎵\n\n` +
      `➡️ Use /setlf to set your Last.fm username\n\n` +
      `➡️ Type / or /help to see a list of valid commands\n` +
      newsLine +
      `\nOn Letterboxd? 🟠🟢🔵 Give @letterboxdgrambot a try\n\n` +
      `By using this bot, you agree to our Terms of Use and Privacy Policy available at /privacy`;

    await ctx.reply(message, {
      reply_markup: botUsername ? keyboard : undefined,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    console.error("Error in handleStart:", error);
  }
}

