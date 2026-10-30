import config from "@/config.ts";
import type { BotContext } from "@/types/context.ts";
import { CommandGroup } from "@grammyjs/commands";

import handleBotStatus from "@/commands/dev/handleBotStatus.ts";
import handleUserInfo from "@/commands/dev/handleUserInfo.ts";
import handleAlblf from "@/commands/handleAlblf.ts";
import handleArtlf from "@/commands/handleArtlf.ts";
import handleGridlf from "@/commands/handleGridlf.ts";
import handleHelp from "@/commands/handleHelp.ts";
import handleLf from "@/commands/handleLf.ts";
import handleMelf from "@/commands/handleMelf.ts";
import handlePrivacy from "@/commands/handlePrivacy.ts";
import handleRankinlf from "@/commands/handleRankinlf.ts";
import handleRankoutlf from "@/commands/handleRankoutlf.ts";
import handleSetlf from "@/commands/handleSetlf.ts";
import handleStart from "@/commands/handleStart.ts";
import handleStorylf from "@/commands/handleStorylf.ts";
import handleYoulf from "@/commands/handleYoulf.ts";

export const userCommands = new CommandGroup<BotContext>();

userCommands.command("start", "Initialize the bot", handleStart);
userCommands.command("lf", "Send your last track scrobble", handleLf);
userCommands.command("alblf", "Send your last album scrobble", handleAlblf);
userCommands.command("artlf", "Send your last artist scrobble", handleArtlf);
userCommands.command("gridlf", "Generate a grid collage", handleGridlf);
userCommands.command("storylf", "Generate a story collage", handleStorylf);
userCommands.command(
  "melf",
  "See your scrobbles for what the user you replied to is listening to",
  handleMelf,
);
userCommands.command(
  "youlf",
  "See the scrobbles of the user you replied to for what you are listening to",
  handleYoulf,
);
userCommands.command(
  "rankinlf",
  "Join a group's Weekly Chart Race",
  handleRankinlf,
);
userCommands.command(
  "rankoutlf",
  "Leave a group's Weekly Chart Race",
  handleRankoutlf,
);
userCommands.command("setlf", "Set your Last.fm username", handleSetlf);
userCommands.command("help", "Send a list of valid commands", handleHelp);
userCommands.command(
  "privacy",
  "Send the Terms of Use and Privacy Policy",
  handlePrivacy,
);

export const devCommands = new CommandGroup<BotContext>();

const adminChatIds = config.bot.devs
  .map((id) => Number(id))
  .filter((id) => !Number.isNaN(id) && id !== 0);

function registerForAdmins(
  name: string,
  description: string,
  handler: (ctx: BotContext) => Promise<void>,
) {
  const cmd = devCommands.command(name, description, handler);
  for (const chatId of adminChatIds) {
    cmd.addToScope({ type: "chat", chat_id: chatId });
  }
}

if (adminChatIds.length > 0) {
  registerForAdmins("lf", "Send your last track scrobble", handleLf);
  registerForAdmins("alblf", "Send your last album scrobble", handleAlblf);
  registerForAdmins("artlf", "Send your last artist scrobble", handleArtlf);
  registerForAdmins("gridlf", "Generate a grid collage", handleGridlf);
  registerForAdmins("storylf", "Generate a story collage", handleStorylf);
  registerForAdmins(
    "melf",
    "See your scrobbles for what the user you replied to is listening to",
    handleMelf,
  );
  registerForAdmins(
    "youlf",
    "See the scrobbles of the user you replied to for what you are listening to",
    handleYoulf,
  );
  registerForAdmins(
    "rankinlf",
    "Join a group's Weekly Chart Race",
    handleRankinlf,
  );
  registerForAdmins(
    "rankoutlf",
    "Leave a group's Weekly Chart Race",
    handleRankoutlf,
  );
  registerForAdmins("setlf", "Set your Last.fm username", handleSetlf);
  registerForAdmins("help", "Send a list of valid commands", handleHelp);
  registerForAdmins(
    "privacy",
    "Send the Terms of Use and Privacy Policy",
    handlePrivacy,
  );
  registerForAdmins(
    "botstatuslf",
    "View bot server and usage statistics (Dev only)",
    handleBotStatus,
  );
  registerForAdmins(
    "userinfolf",
    "View user Telegram ID and Last.fm account (Dev only)",
    handleUserInfo,
  );
}

