import Bottleneck from "bottleneck";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import type { Message } from "grammy/types";

/**
 * Maximum number of concurrent heavy collage tasks (API pagination + Skia rendering).
 * Recommended value for a 1 GB RAM VPS is 2 to prevent out-of-memory (OOM) crashes.
 */
export const MAX_CONCURRENT_COLLAGES = 2;

const collageLimiter = new Bottleneck({
  maxConcurrent: MAX_CONCURRENT_COLLAGES,
  minTime: 0,
});

let activeSlots = 0;
let waitingInQueue = 0;

export function getCollageQueueStatus(): {
  active: number;
  waiting: number;
  maxConcurrent: number;
} {
  return {
    active: activeSlots,
    waiting: waitingInQueue,
    maxConcurrent: MAX_CONCURRENT_COLLAGES,
  };
}

/**
 * Executes a heavy collage task safely within the global concurrency limit.
 * If the server is currently at maximum capacity, the user receives an English
 * queue notification with their position in line. As soon as a slot frees up,
 * their message is updated with the generation tip and the task executes.
 */
export async function runWithCollageQueue<T>(
  ctx: BotContext,
  initialTip: FormattedString,
  task: () => Promise<T>,
): Promise<T> {
  const replyParams = ctx.message
    ? { message_id: ctx.message.message_id }
    : undefined;

  let progressMsg: Message.TextMessage | null = null;
  let isQueued = false;
  let queuePosition = 0;

  if (activeSlots >= MAX_CONCURRENT_COLLAGES) {
    waitingInQueue++;
    queuePosition = waitingInQueue;
    isQueued = true;

    const queueNotice = new FormattedString(
      "⏳ High server load: your collage request has been queued.\n\n",
    )
      .bold(`Position in queue: #${queuePosition}\n\n`)
      .italic(
        "💡 Processing will start automatically as soon as a slot becomes available. Thank you for your patience!",
      );

    try {
      progressMsg = (await ctx.reply(queueNotice.text, {
        entities: queueNotice.entities,
        reply_parameters: replyParams,
      })) as Message.TextMessage;
    } catch {
      // Ignore if reply cannot be sent
    }
  } else {
    // Slot is available immediately
    activeSlots++;
  }

  let hasStarted = false;

  try {
    return await collageLimiter.schedule(async () => {
      hasStarted = true;
      if (isQueued) {
        waitingInQueue = Math.max(0, waitingInQueue - 1);
        activeSlots++;
      }

      try {
        if (progressMsg) {
          // User was in queue: update the message with the generation tip
          try {
            await ctx.api.editMessageText(
              progressMsg.chat.id,
              progressMsg.message_id,
              initialTip.text,
              { entities: initialTip.entities },
            );
          } catch {
            // If edit fails, try sending a fresh progress message
            try {
              progressMsg = (await ctx.reply(initialTip.text, {
                entities: initialTip.entities,
                reply_parameters: replyParams,
              })) as Message.TextMessage;
            } catch {
              // Ignore
            }
          }
        } else {
          // Slot was immediately free: send initial generation tip
          try {
            progressMsg = (await ctx.reply(initialTip.text, {
              entities: initialTip.entities,
              reply_parameters: replyParams,
            })) as Message.TextMessage;
          } catch {
            // Ignore
          }
        }

        return await task();
      } finally {
        activeSlots = Math.max(0, activeSlots - 1);
        if (progressMsg) {
          try {
            await ctx.api.deleteMessage(
              progressMsg.chat.id,
              progressMsg.message_id,
            );
          } catch {
            // Ignore if message was already deleted or cannot be deleted
          }
        }
      }
    });
  } catch (err) {
    if (!isQueued && !hasStarted) {
      activeSlots = Math.max(0, activeSlots - 1);
    }
    throw err;
  }
}

export default runWithCollageQueue;
