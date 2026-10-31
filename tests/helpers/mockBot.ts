import { Bot } from "grammy";
import type { BotContext } from "@/types/context.ts";
import { commands } from "@grammyjs/commands";
import { hydrate } from "@grammyjs/hydrate";
import { userCommands } from "@/commands/index.ts";
import ignoreChannelMessages from "@/middlewares/ignoreChannelMessages.ts";
import safeReplyTransformer from "@/middlewares/safeReplyTransformer.ts";
import { DEFAULT_TEST_BOT_INFO, type OutgoingCall } from "./testUpdates.ts";

export type TestBotInstance = {
  bot: Bot<BotContext>;
  calls: OutgoingCall[];
  findCall: (method: string) => OutgoingCall | undefined;
  filterCalls: (method: string) => OutgoingCall[];
};

export function createMockBot(): TestBotInstance {
  const bot = new Bot<BotContext>("mock-token:ABC-DEF-123456789", {
    botInfo: DEFAULT_TEST_BOT_INFO,
  });

  const calls: OutgoingCall[] = [];

  bot.api.config.use(async (prev, method, payload, signal) => {
    calls.push({
      method,
      payload: (payload && typeof payload === "object"
        ? { ...payload }
        : {}) as Record<string, unknown>,
    });

    if (method === "sendMessage") {
      const p = payload as Record<string, unknown>;
      return {
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 10000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: p?.chat_id ?? 1, type: "private" },
          text: p?.text ?? "",
          entities: p?.entities,
        },
      } as any;
    }

    if (method === "sendChatAction") {
      return { ok: true, result: true } as any;
    }

    if (method === "sendPhoto") {
      const p = payload as Record<string, unknown>;
      return {
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 10000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: p?.chat_id ?? 1, type: "private" },
          photo: [{ file_id: "test-photo", width: 100, height: 100 }],
          caption: p?.caption,
        },
      } as any;
    }

    if (method === "deleteMessage") {
      return { ok: true, result: true } as any;
    }

    return { ok: true, result: true } as any;
  });

  bot.api.config.use(safeReplyTransformer);
  bot.use(hydrate());
  bot.use(commands());
  bot.use(ignoreChannelMessages);
  bot.use(userCommands);

  return {
    bot,
    calls,
    findCall: (method: string) => calls.find((c) => c.method === method),
    filterCalls: (method: string) => calls.filter((c) => c.method === method),
  };
}

