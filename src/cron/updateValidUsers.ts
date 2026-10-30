import {
  getAllRankGroups,
  getUsersByChatId,
  removeInvalidUsersFromGroup,
} from "@/database/services/rankGroupParticipants.ts";
import type { BotContext } from "@/types/context.ts";
import type { Bot } from "grammy";

const VALID_USER_STATUS = new Set([
  "administrator",
  "member",
  "creator",
  "restricted",
]);

async function verifyMember(
  bot: Bot<BotContext>,
  chat_id: number,
  telegram_id: number,
): Promise<boolean> {
  try {
    const memberInfo = await bot.api.getChatMember(chat_id, telegram_id);
    return VALID_USER_STATUS.has(memberInfo.status);
  } catch (error) {
    console.error(`CRONJOB: Error verifying user ${telegram_id}:`, error);
    return false;
  }
}

export default async function updateValidUsers(
  bot: Bot<BotContext>,
): Promise<void> {
  const groups = await getAllRankGroups();

  for (const chat_id of groups) {
    try {
      const groupUsers = await getUsersByChatId(chat_id);
      const validUsers: number[] = [];

      for (const userId of groupUsers) {
        const isValid = await verifyMember(bot, chat_id, userId);
        if (isValid) {
          validUsers.push(userId);
        }
      }

      await removeInvalidUsersFromGroup(chat_id, validUsers);
    } catch (error) {
      console.error(`CRONJOB: Error updating group ${chat_id}:`, error);
    }
  }
}

