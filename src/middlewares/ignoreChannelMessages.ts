import type { Context, NextFunction } from "grammy";

export async function ignoreChannelMessages(
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  if (ctx.channelPost) {
    return;
  }

  if (ctx.message) {
    const chatType = (ctx.message.chat as { type?: string }).type;
    const isFromChannel = chatType === "channel";
    const forwardedChatType =
      (ctx.message as { forward_from_chat?: { type?: string } })
        .forward_from_chat?.type;
    const isForwardedFromChannel = forwardedChatType === "channel";

    if (isFromChannel || isForwardedFromChannel) {
      return;
    }
  }

  await next();
}

export default ignoreChannelMessages;

