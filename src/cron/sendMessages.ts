import {
  deleteGroupFromRank,
  getAllRankGroups,
  getUsersByChatId,
} from "@/database/services/rankGroupParticipants.ts";
import { getUserScrobblesPlaycount } from "@/database/services/weeklyScrobblesPlaycount.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { type Bot, GrammyError } from "grammy";

function getMedal(index: number): string {
  const medals = ["🥇", "🥈", "🥉", "🏅"];
  return medals[index] || medals[3];
}

export default async function sendMessages(
  bot: Bot<BotContext>,
): Promise<void> {
  const groups = await getAllRankGroups();

  for (const chat_id of groups) {
    try {
      const users = await getUsersByChatId(chat_id);
      if (users.length === 0) continue;

      console.log(
        `CRONJOB: Sending Weekly Chart Race to group ${chat_id} (${users.length} participants)`,
      );

      const participants: Array<{
        telegram_id: number;
        displayName: string;
        scrobbles_playcount: number;
      }> = [];

      for (const telegram_id of users) {
        try {
          const [memberInfo, scrobblesInfo] = await Promise.all([
            bot.api.getChatMember(chat_id, telegram_id),
            getUserScrobblesPlaycount(telegram_id),
          ]);

          const displayName =
            memberInfo.user.first_name ||
            (memberInfo.user.username ? `@${memberInfo.user.username}` : "") ||
            String(telegram_id);

          participants.push({
            telegram_id,
            displayName,
            scrobbles_playcount: scrobblesInfo?.scrobbles_playcount ?? 0,
          });
        } catch (userError) {
          console.error(
            `CRONJOB: Error processing user ${telegram_id} in group ${chat_id}:`,
            userError,
          );
        }
      }

      if (participants.length === 0) continue;

      participants.sort(
        (a, b) => b.scrobbles_playcount - a.scrobbles_playcount,
      );

      let msg = FormattedString.bold("🏆 Weekly Tracks Chart 🏆\n");

      const topTen = participants.slice(0, 10);
      topTen.forEach((item, index) => {
        if (index === 3) {
          msg = msg.plain("\n");
        }

        const count = Number(item.scrobbles_playcount) || 0;
        const label = count !== 1 ? "scrobbles" : "scrobble";

        msg = msg
          .plain(`\n${getMedal(index)} `)
          .mentionUser(item.displayName, item.telegram_id)
          .plain(` - ${count.toLocaleString("pt-BR")} ${label}`);
      });

      msg = msg.plain(
        "\n\nUse /rankinlf to join or /rankoutlf to quit the race.",
      );

      await bot.api.sendMessage(chat_id, msg.text, {
        entities: msg.entities,
      });
    } catch (groupError) {
      if (groupError instanceof GrammyError) {
        if (
          groupError.error_code === 403 ||
          (groupError.error_code === 400 &&
            /chat not found/i.test(groupError.description))
        ) {
          console.log(
            `CRONJOB: Bot was kicked or group deleted (${chat_id}). Removing from ranking database.`,
          );
          await deleteGroupFromRank(chat_id);
          continue;
        }
      }
      console.error(
        `CRONJOB: Error sending message to group ${chat_id}:`,
        groupError,
      );
    }
  }
}

