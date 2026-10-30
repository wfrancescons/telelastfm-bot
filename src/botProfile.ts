import { devCommands, userCommands } from "@/commands/index.ts";
import config from "@/config.ts";
import type { BotContext } from "@/types/context.ts";
import type { Bot } from "grammy";

export async function setupBotProfile(bot: Bot<BotContext>): Promise<void> {
  if (!config.bot.token) {
    return;
  }

  try {
    await userCommands.setCommands(bot);
    await devCommands.setCommands(bot);

    await bot.api.setMyDescription(
      "Share your Last.fm scrobbles with your friends 🎵",
    );

    const aboutDescription =
      `Share your Last.fm scrobbles with your friends 🎵\n\n` +
      (config.bot.news_channel ? `📰 News: ${config.bot.news_channel}\n` : "") +
      (config.bot.support_chat
        ? `💬 Need help? Support: ${config.bot.support_chat}`
        : "");

    if (aboutDescription.length <= 120) {
      await bot.api.setMyShortDescription(aboutDescription);
    }
  } catch (err) {
    console.error(
      "BOT: Failed to set bot profile or commands in Telegram:",
      err,
    );
  }
}

export default setupBotProfile;

