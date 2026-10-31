import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FormattedString } from "@grammyjs/parse-mode";
import {
  getCollageQueueStatus,
  MAX_CONCURRENT_COLLAGES,
  runWithCollageQueue,
} from "@/services/collageQueue.ts";
import type { BotContext } from "@/types/context.ts";

function createMockContext(chatId = 12345, messageId = 999) {
  const sentMessages: Array<{ text: string; id: number }> = [];
  const editedMessages: Array<{ text: string; id: number }> = [];
  const deletedMessages: number[] = [];

  let nextMessageId = 1000;

  const ctx = {
    chat: { id: chatId, type: "private" },
    message: { message_id: messageId },
    from: { id: chatId, first_name: "TestUser" },
    api: {
      editMessageText: (
        _chatId: number,
        msgId: number,
        text: string,
        _other?: unknown,
      ) => {
        editedMessages.push({ text, id: msgId });
        return Promise.resolve(true);
      },
      deleteMessage: (_chatId: number, msgId: number) => {
        deletedMessages.push(msgId);
        return Promise.resolve(true);
      },
    },
    reply: (text: string, _other?: unknown) => {
      const id = ++nextMessageId;
      sentMessages.push({ text, id });
      return Promise.resolve({
        message_id: id,
        chat: { id: chatId, type: "private" },
        text,
        date: Math.floor(Date.now() / 1000),
      });
    },
  } as unknown as BotContext;

  return { ctx, sentMessages, editedMessages, deletedMessages };
}

describe("Collage Queue (Resource Limiter & Concurrency Manager)", () => {
  it("should have MAX_CONCURRENT_COLLAGES set to 2", () => {
    assert.equal(MAX_CONCURRENT_COLLAGES, 2);
  });

  it("should execute task immediately when below capacity", async () => {
    const { ctx, sentMessages, deletedMessages } = createMockContext();
    const tip = new FormattedString("Generating your calendar...");

    let executed = false;
    const result = await runWithCollageQueue(ctx, tip, async () => {
      await Promise.resolve();
      executed = true;
      return "SUCCESS";
    });

    assert.equal(executed, true);
    assert.equal(result, "SUCCESS");
    assert.equal(sentMessages.length, 1);
    assert.match(sentMessages[0].text, /Generating your calendar/);
    assert.equal(deletedMessages.length, 1);
  });

  it("should enforce maximum concurrency of 2 and queue 3rd request with notification", async () => {
    const mock1 = createMockContext(1, 101);
    const mock2 = createMockContext(2, 102);
    const mock3 = createMockContext(3, 103);

    const tip = new FormattedString("Generating...");

    let running = 0;
    let maxRunning = 0;

    let resolve1!: () => void;
    let resolve2!: () => void;

    const p1 = runWithCollageQueue(mock1.ctx, tip, async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise<void>((r) => (resolve1 = r));
      running--;
      return 1;
    });

    const p2 = runWithCollageQueue(mock2.ctx, tip, async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise<void>((r) => (resolve2 = r));
      running--;
      return 2;
    });

    // Give microtasks time to start p1 and p2
    await new Promise((r) => setTimeout(r, 20));

    // At this point, slots are 2/2. Task 3 should be queued!
    const p3 = runWithCollageQueue(mock3.ctx, tip, async () => {
      await Promise.resolve();
      running++;
      maxRunning = Math.max(maxRunning, running);
      running--;
      return 3;
    });

    // Give time to queue and send queue notice
    await new Promise((r) => setTimeout(r, 20));

    // Verify task 3 received queue notice in English
    assert.equal(mock3.sentMessages.length, 1);
    assert.match(mock3.sentMessages[0].text, /High server load: your collage request has been queued/i);
    assert.match(mock3.sentMessages[0].text, /Position in queue: #1/i);

    // Concurrency should not exceed 2
    assert.equal(maxRunning <= 2, true);

    // Release task 1
    resolve1();
    await p1;

    // Give time for task 3 to take the freed slot and edit its message
    await new Promise((r) => setTimeout(r, 20));

    assert.equal(mock3.editedMessages.length, 1);
    assert.match(mock3.editedMessages[0].text, /Generating.../);

    // Release task 2
    resolve2();
    await p2;
    await p3;

    assert.equal(maxRunning, 2);
    const status = getCollageQueueStatus();
    assert.equal(status.active, 0);
    assert.equal(status.waiting, 0);
  });

  it("should release slot and delete progress message when task throws an error", async () => {
    const { ctx, sentMessages, deletedMessages } = createMockContext();
    const tip = new FormattedString("Generating...");

    let caughtError: unknown = null;
    try {
      await runWithCollageQueue(ctx, tip, async () => {
        await Promise.resolve();
        throw new Error("TEST_CRASH");
      });
    } catch (err) {
      caughtError = err;
    }

    assert.ok(caughtError);
    assert.equal(sentMessages.length, 1);
    // Even after error, progressMsg should be deleted in finally
    assert.equal(deletedMessages.length, 1);

    const status = getCollageQueueStatus();
    assert.equal(status.active, 0);
  });
});
