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

  // deno-lint-ignore no-explicit-any
  bot.api.config.use((_prev, method, payload, _signal): Promise<any> => {
    calls.push({
      method,
      payload: (payload && typeof payload === "object"
        ? { ...payload }
        : {}) as Record<string, unknown>,
    });

    if (method === "sendMessage") {
      const p = payload as Record<string, unknown>;
      return Promise.resolve({
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 10000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: p?.chat_id ?? 1, type: "private" },
          text: p?.text ?? "",
          entities: p?.entities,
        },
      });
    }

    if (method === "sendChatAction") {
      return Promise.resolve({ ok: true, result: true });
    }

    if (method === "sendPhoto") {
      const p = payload as Record<string, unknown>;
      return Promise.resolve({
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 10000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: p?.chat_id ?? 1, type: "private" },
          photo: [{ file_id: "test-photo", width: 100, height: 100 }],
          caption: p?.caption,
        },
      });
    }

    if (method === "sendDocument") {
      const p = payload as Record<string, unknown>;
      return Promise.resolve({
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 10000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: p?.chat_id ?? 1, type: "private" },
          document: { file_id: "test-doc" },
          caption: p?.caption,
        },
      });
    }

    if (method === "editMessageText") {
      const p = payload as Record<string, unknown>;
      return Promise.resolve({
        ok: true,
        result: {
          message_id: p?.message_id ?? 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: p?.chat_id ?? 1, type: "private" },
          text: p?.text ?? "",
        },
      });
    }

    if (method === "deleteMessage") {
      return Promise.resolve({ ok: true, result: true });
    }

    return Promise.resolve({ ok: true, result: true });
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

