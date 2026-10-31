import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ignoreChannelMessages } from "@/middlewares/ignoreChannelMessages.ts";
import { safeReplyTransformer } from "@/middlewares/safeReplyTransformer.ts";

describe("Middlewares", () => {
  describe("ignoreChannelMessages", () => {
    it("should ignore channel posts", async () => {
      let nextCalled = false;
      const ctx = {
        channelPost: { message_id: 1, text: "channel" },
      } as any;

      await ignoreChannelMessages(ctx, async () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
    });

    it("should ignore messages originating from channels", async () => {
      let nextCalled = false;
      const ctx = {
        message: {
          chat: { type: "channel" },
        },
      } as any;

      await ignoreChannelMessages(ctx, async () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
    });

    it("should ignore messages forwarded from a channel", async () => {
      let nextCalled = false;
      const ctx = {
        message: {
          chat: { type: "supergroup" },
          forward_from_chat: { type: "channel" },
        },
      } as any;

      await ignoreChannelMessages(ctx, async () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false);
    });

    it("should allow normal private or group messages", async () => {
      let nextCalled = false;
      const ctx = {
        message: {
          chat: { type: "private" },
        },
      } as any;

      await ignoreChannelMessages(ctx, async () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  describe("safeReplyTransformer", () => {
    it("should inject allow_sending_without_reply: true when reply_parameters exists", async () => {
      const capturedPayloads: any[] = [];
      const mockPrev = async (_method: any, payload: any) => {
        capturedPayloads.push(payload);
        return { ok: true, result: {} } as any;
      };

      const payload = {
        chat_id: 123,
        text: "hello",
        reply_parameters: { message_id: 456 },
      };

      await safeReplyTransformer(mockPrev as any, "sendMessage", payload, undefined as any);

      assert.equal(capturedPayloads.length, 1);
      assert.equal(capturedPayloads[0].reply_parameters.allow_sending_without_reply, true);
      assert.equal(capturedPayloads[0].reply_parameters.message_id, 456);
    });

    it("should retry without reply_parameters when original message was deleted", async () => {
      let attempts = 0;
      const payloads: any[] = [];

      const mockPrev = async (_method: any, payload: any) => {
        attempts++;
        payloads.push(payload);
        if (attempts === 1) {
          return {
            ok: false,
            error_code: 400,
            description: "Bad Request: message to be replied not found",
          } as any;
        }
        return { ok: true, result: { message_id: 999 } } as any;
      };

      const payload = {
        chat_id: 123,
        text: "hello",
        reply_parameters: { message_id: 456 },
      };

      const result = await safeReplyTransformer(
        mockPrev as any,
        "sendMessage",
        payload,
        undefined as any,
      );

      assert.equal(attempts, 2);
      assert.equal(result.ok, true);
      assert.equal("reply_parameters" in payloads[1], false);
    });
  });
});

