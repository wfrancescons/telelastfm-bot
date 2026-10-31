import type { Update, UserFromGetMe } from "grammy/types";

export type OutgoingCall = {
  method: string;
  payload: Record<string, unknown>;
};

export const DEFAULT_TEST_BOT_INFO: UserFromGetMe = {
  id: 123456789,
  is_bot: true,
  first_name: "TestBot",
  username: "telelastfmbot",
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: true,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
};

export function createTestUpdate(
  text: string,
  options: {
    userId?: number;
    chatId?: number;
    firstName?: string;
    username?: string;
    chatType?: "private" | "group" | "supergroup";
    messageId?: number;
    replyToMessage?: {
      messageId?: number;
      userId?: number;
      firstName?: string;
      username?: string;
      text?: string;
      isBot?: boolean;
    };
  } = {},
): Update {
  const userId = options.userId ?? 999001;
  const chatId = options.chatId ?? userId;
  const messageId = options.messageId ?? 1;

  const chat = options.chatType === "group" || options.chatType === "supergroup"
    ? {
      id: chatId,
      type: options.chatType,
      title: "Test Group",
    }
    : {
      id: chatId,
      type: "private" as const,
      first_name: options.firstName ?? "TestUser",
      username: options.username ?? "testuser",
    };

  const reply_to_message = options.replyToMessage
    ? {
      message_id: options.replyToMessage.messageId ?? 100,
      date: Math.floor(Date.now() / 1000) - 10,
      chat,
      from: {
        id: options.replyToMessage.userId ?? 888001,
        is_bot: options.replyToMessage.isBot ?? false,
        first_name: options.replyToMessage.firstName ?? "RepliedUser",
        username: options.replyToMessage.username ?? "replieduser",
      },
      text: options.replyToMessage.text ?? "Hello",
      reply_to_message: undefined,
    }
    : undefined;

  return {
    update_id: Math.floor(Math.random() * 100000) + 1,
    message: {
      message_id: messageId,
      date: Math.floor(Date.now() / 1000),
      chat,
      from: {
        id: userId,
        is_bot: false,
        first_name: options.firstName ?? "TestUser",
        username: options.username ?? "testuser",
      },
      text,
      reply_to_message,
      entities: text.startsWith("/")
        ? [
          {
            type: "bot_command",
            offset: 0,
            length: text.split(/\s+/)[0].length,
          },
        ]
        : undefined,
    },
  };
}
