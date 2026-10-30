import type { BotContext } from "@/types/context.ts";
import { Cron } from "croner";
import type { Bot } from "grammy";
import sendMessages from "./sendMessages.ts";
import updateUserScrobbles from "./updateUserScrobbles.ts";
import updateValidUsers from "./updateValidUsers.ts";

// '0 30 19 * * 0' - Every Sunday at 19:30 (America/Sao_Paulo)
export function startCronJob(bot: Bot<BotContext>): Cron {
  const job = new Cron(
    "0 30 19 * * 0",
    { timezone: "America/Sao_Paulo" },
    async () => {
      try {
        console.log("CRONJOB: Task started");
        await updateValidUsers(bot);
        await updateUserScrobbles();
        await sendMessages(bot);
        console.log("CRONJOB: Task finished");
      } catch (error) {
        console.error("CRONJOB: Error running task:", error);
      }
    },
  );

  console.log("CRONJOB: Task scheduled");
  return job;
}

export default startCronJob;

