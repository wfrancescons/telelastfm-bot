import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Update } from "grammy/types";
import { createMockBot } from "./helpers/mockBot.ts";
import { createTestUpdate } from "./helpers/testUpdates.ts";

describe("GrammY Bot Commands (Update Handling & API Transformers)", () => {
  describe("/start command", () => {
    it("should respond with welcome message and keyboard", async () => {
      const { bot, filterCalls } = createMockBot();

      const update = createTestUpdate("/start", {
        userId: 111222,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendChatAction = filterCalls("sendChatAction");
      assert.equal(sendChatAction.length >= 1, true);
      assert.equal(sendChatAction[0].payload.action, "typing");

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Hello, Alice/);
      assert.match(text, /Welcome to the telelastfm bot/);
      assert.match(text, /\/setlf/);
    });
  });

  describe("/privacy command", () => {
    it("should send privacy policy and terms of use", async () => {
      const { bot, filterCalls } = createMockBot();

      const update = createTestUpdate("/privacy", {
        userId: 333444,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Termos de Uso e Política de Privacidade/);
      assert.match(text, /Coleta de Dados/);
    });
  });

  describe("/help command", () => {
    it("should return the list of valid commands", async () => {
      const { bot, filterCalls } = createMockBot();

      const update = createTestUpdate("/help", {
        userId: 555666,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Valid commands:/);
      assert.match(text, /\/gridlf/);
      assert.match(text, /\/vinyllf/);
      assert.match(text, /\/calendarlf/);
      assert.match(text, /\/profilelf/);
    });
  });

  describe("Channel ignore middleware via bot.handleUpdate", () => {
    it("should not process commands sent as channel posts", async () => {
      const { bot, filterCalls } = createMockBot();

      const channelUpdate = {
        update_id: 888999,
        channel_post: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: -100123456789, title: "Test Channel", type: "channel" },
          text: "/start",
        },
      } as unknown as Update;

      await bot.handleUpdate(channelUpdate);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 0);
    });
  });
});

