import type { Transformer } from "grammy";

export async function safeReplyTransformer(
  prev: Parameters<Transformer>[0],
  method: Parameters<Transformer>[1],
  payload: Parameters<Transformer>[2],
  signal: Parameters<Transformer>[3],
): Promise<Awaited<ReturnType<Transformer>>> {
  if (payload && typeof payload === "object" && "reply_parameters" in payload) {
    const replyParams = (payload as Record<string, unknown>).reply_parameters;

    if (replyParams && typeof replyParams === "object") {
      (payload as Record<string, unknown>).reply_parameters = {
        ...replyParams,
        allow_sending_without_reply: true,
      };
    }
  }

  const response = await prev(method, payload, signal);

  if (
    !response.ok &&
    response.error_code === 400 &&
    response.description.includes("message to be replied not found") &&
    payload &&
    typeof payload === "object" &&
    "reply_parameters" in payload
  ) {
    const fallbackPayload = { ...(payload as Record<string, unknown>) };
    delete fallbackPayload.reply_parameters;
    return await prev(method, fallbackPayload as typeof payload, signal);
  }

  return response;
}

export default safeReplyTransformer;

