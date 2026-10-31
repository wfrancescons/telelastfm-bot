import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handleHelp(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("help", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const botUsername = config.bot.username
      ? `@${config.bot.username.replace("@", "")}`
      : "@telelastfmbot";

    const msg = FormattedString
      .bold("Valid commands: 🤖\n\n")
      .plain("/lf - Track you're scrobbling\n")
      .plain("/alblf - Album you're scrobbling\n")
      .plain("/artlf - Artist you're scrobbling\n")
      .code("/setlf <username>")
      .plain(" - Set your Last.fm username\n")
      .code("/gridlf <cols>x<rows> <type> <period>")
      .plain(" - Generate a grid collage\n")
      .code("/storylf <type>")
      .plain(" - Generate an image of your latest scrobble\n")
      .code("/vinyllf <type>")
      .plain(" - Generate a vinyl record image of your latest scrobble\n")
      .code("/calendarlf <type> <MM/YYYY>")
      .plain(" - Generate a monthly calendar collage\n")
      .plain("/melf - Compare your scrobbles with the replied user\n")
      .plain("/youlf - Compare the replied user's scrobbles with yours\n")
      .plain("/rankinlf - Join a group's Weekly Chart Race\n")
      .plain("/rankoutlf - Leave a group's Weekly Chart Race\n\n")
      .bold("Inline Mode")
      .plain(
        ` - In any chat, type ${botUsername} to share your current scrobbles\n`,
      );

    if (config.bot.news_channel) {
      msg.plain(
        `\nAccess ${config.bot.news_channel} for news and server status`,
      );
    }

    await ctx.reply(msg.text, {
      entities: msg.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    console.error("Error in handleHelp:", error);
  }
}

