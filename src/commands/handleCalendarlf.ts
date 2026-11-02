import calendarlfTemplate from "@/commands/templates/calendarlfTemplate.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import renderCanvas from "@/rendering/renderCanvas.ts";
import runWithCollageQueue from "@/services/collageQueue.ts";
import { getUserMonthlyCalendarData } from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import {
  acceptedCollageParams,
  acceptedHdParams,
  acceptedMedias,
  collageParamMap,
  hasHdParam,
  mediaMap,
  type MediaType,
} from "@/utils/validValuesMap.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InputFile } from "grammy";

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 0,
  january: 0,
  janeiro: 0,
  feb: 1,
  fev: 1,
  february: 1,
  fevereiro: 1,
  mar: 2,
  march: 2,
  marco: 2,
  "março": 2,
  apr: 3,
  abr: 3,
  april: 3,
  abril: 3,
  may: 4,
  mai: 4,
  maio: 4,
  jun: 5,
  june: 5,
  junho: 5,
  jul: 6,
  july: 6,
  julho: 6,
  aug: 7,
  ago: 7,
  august: 7,
  agosto: 7,
  sep: 8,
  sept: 8,
  set: 8,
  september: 8,
  setembro: 8,
  oct: 9,
  out: 9,
  october: 9,
  outubro: 9,
  nov: 10,
  november: 10,
  novembro: 10,
  dec: 11,
  dez: 11,
  december: 11,
  dezembro: 11,
};

function parseMonthToken(token: string): number | null {
  const lower = token.toLowerCase();
  if (lower in MONTH_NAME_MAP) {
    return MONTH_NAME_MAP[lower];
  }
  if (/^\d{1,2}$/.test(lower)) {
    const num = Number(lower);
    if (num >= 1 && num <= 12) {
      return num - 1;
    }
  }
  return null;
}

function isValidMonthYear(year: number, monthIndex: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex)) return false;
  if (monthIndex < 0 || monthIndex > 11) return false;
  if (year < 2002) return false; // Last.fm founded in 2002

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (year > currentYear) return false;
  if (year === currentYear && monthIndex > currentMonth) return false;
  return true;
}

function parseCombinedDateToken(
  token: string,
): { year: number; monthIndex: number } | null {
  const parts = token.split(/[\/\-\.]/);
  if (parts.length !== 2) return null;

  const [first, second] = parts;

  // Format: MM/YYYY or monthName/YYYY
  if (/^\d{4}$/.test(second)) {
    const year = Number(second);
    const monthIndex = parseMonthToken(first);
    if (monthIndex !== null && isValidMonthYear(year, monthIndex)) {
      return { year, monthIndex };
    }
    return null;
  }

  // Format: YYYY-MM or YYYY/monthName
  if (/^\d{4}$/.test(first)) {
    const year = Number(first);
    const monthIndex = parseMonthToken(second);
    if (monthIndex !== null && isValidMonthYear(year, monthIndex)) {
      return { year, monthIndex };
    }
    return null;
  }

  return null;
}

export function parseCalendarArgs(rawText: string): {
  media_type: MediaType;
  year: number;
  monthIndex: number;
  param: string | null;
} {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  let media_type: MediaType = "albums";
  let param: string | null = null;

  const tokens = rawText
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .slice(1)
    .filter(Boolean);

  if (tokens.length === 0) {
    return { media_type, year, monthIndex, param };
  }

  const remainingTokens: string[] = [];

  for (const token of tokens) {
    if ((acceptedMedias as readonly string[]).includes(token)) {
      media_type = mediaMap[token];
    } else if ((acceptedCollageParams as readonly string[]).includes(token)) {
      param = collageParamMap[token];
    } else if ((acceptedHdParams as readonly string[]).includes(token)) {
      // Ignored for date parsing; handled via hasHdParam
      continue;
    } else {
      remainingTokens.push(token);
    }
  }

  if (remainingTokens.length === 0) {
    return { media_type, year, monthIndex, param };
  }

  if (remainingTokens.length === 1) {
    const parsed = parseCombinedDateToken(remainingTokens[0]);
    if (!parsed) {
      throw "CALENDAR_INVALID_DATE";
    }
    return {
      media_type,
      year: parsed.year,
      monthIndex: parsed.monthIndex,
      param,
    };
  }

  if (remainingTokens.length === 2) {
    const [t1, t2] = remainingTokens;
    // Try <month> <YYYY>
    if (/^\d{4}$/.test(t2)) {
      const m = parseMonthToken(t1);
      const y = Number(t2);
      if (m !== null && isValidMonthYear(y, m)) {
        return { media_type, year: y, monthIndex: m, param };
      }
    }
    // Try <YYYY> <month>
    if (/^\d{4}$/.test(t1)) {
      const m = parseMonthToken(t2);
      const y = Number(t1);
      if (m !== null && isValidMonthYear(y, m)) {
        return { media_type, year: y, monthIndex: m, param };
      }
    }
    throw "CALENDAR_INVALID_DATE";
  }

  throw "CALENDAR_INVALID_DATE";
}

export default async function handleCalendarlf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("calendarlf", telegram_id, chat_id);

  try {
    ctx.replyWithChatAction("typing").catch(() => {});

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const { media_type, year, monthIndex, param } = parseCalendarArgs(
      ctx.message?.text || "",
    );

    const monthLabel = `${String(monthIndex + 1).padStart(2, "0")}/${year}`;

    const tip = new FormattedString(
      `Generating your ${media_type} calendar (${monthLabel})...\n\n`,
    )
      .bold("⏰ It may take a while\n\n")
      .italic(
        "💡 Tip: you can customize the media type, date, or overlay style:\n\n",
      )
      .plain("➡️ Examples:\n")
      .code("/calendarlf alb")
      .plain("\n")
      .code("/calendarlf tracks 08/2025")
      .plain("\n")
      .code("/calendarlf art notitles 12/2025")
      .plain("\n")
      .code("/calendarlf alb clean");

    await runWithCollageQueue(ctx, tip, async () => {
      let daysData;
      try {
        daysData = await getUserMonthlyCalendarData(
          lastfm_user,
          year,
          monthIndex,
          media_type,
        );
      } catch (err) {
        if (err === "ZERO_SCROBBLES") {
          throw "CALENDAR_NO_DATA";
        }
        throw err;
      }

      const isHd = hasHdParam(ctx.message?.text || "");
      ctx
        .replyWithChatAction(isHd ? "upload_document" : "upload_photo")
        .catch(() => {});

      const template = calendarlfTemplate({
        year,
        monthIndex,
        media_type,
        daysData,
        param,
      });

      const canvasBuffer = await renderCanvas(template);

      const displayName = ctx.from?.first_name || ctx.from?.username || "User";
      const caption = `${displayName}, your ${media_type} calendar (${monthLabel})`;
      const ext = template.format === "png" ? "png" : "jpg";
      const filename = `calendar_${monthLabel.replace(/\s+/g, "_")}_${media_type}.${ext}`;

      if (isHd) {
        await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
          caption,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
      } else {
        const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
        if (canvasBuffer.byteLength > MAX_PHOTO_BYTES) {
          await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
            caption,
            reply_parameters: ctx.message
              ? { message_id: ctx.message.message_id }
              : undefined,
          });
        } else {
          await ctx.replyWithPhoto(new InputFile(canvasBuffer, filename), {
            caption,
            reply_parameters: ctx.message
              ? { message_id: ctx.message.message_id }
              : undefined,
          });
        }
      }
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}
