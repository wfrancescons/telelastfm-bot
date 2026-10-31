import {
  deleteGroupFromRank,
  getAllRankGroups,
  getUsersByChatId,
  removeInvalidUsersFromGroup,
} from "@/database/services/rankGroupParticipants.ts";
import type { BotContext } from "@/types/context.ts";
import { type Bot, GrammyError } from "grammy";

const VALID_USER_STATUS = new Set([
  "administrator",
  "member",
  "creator",
  "restricted",
]);

type MemberVerificationResult = {
  isValid: boolean;
  kickedFromGroup?: boolean;
};

async function verifyMember(
  bot: Bot<BotContext>,
  chat_id: number,
  telegram_id: number,
): Promise<MemberVerificationResult> {
  try {
    const memberInfo = await bot.api.getChatMember(chat_id, telegram_id);
    return { isValid: VALID_USER_STATUS.has(memberInfo.status) };
  } catch (error) {
    if (error instanceof GrammyError) {
      if (
        error.error_code === 403 ||
        (error.error_code === 400 && /chat not found/i.test(error.description))
      ) {
        return { isValid: false, kickedFromGroup: true };
      }
    }
    console.error(`CRONJOB: Error verifying user ${telegram_id}:`, error);
    return { isValid: false };
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
      let isKicked = false;

      for (const userId of groupUsers) {
        const result = await verifyMember(bot, chat_id, userId);
        if (result.kickedFromGroup) {
          isKicked = true;
          break;
        }
        if (result.isValid) {
          validUsers.push(userId);
        }
      }

      if (isKicked) {
        console.log(
          `CRONJOB: Bot was removed from group ${chat_id}. Cleaning up group from rank database.`,
        );
        await deleteGroupFromRank(chat_id);
        continue;
      }

      await removeInvalidUsersFromGroup(chat_id, validUsers);
    } catch (error) {
      console.error(`CRONJOB: Error updating group ${chat_id}:`, error);
    }
  }
}

