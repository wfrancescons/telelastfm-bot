import gridlfTemplate from "@/commands/templates/gridlfTemplate.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastfmUser } from "@/database/services/users.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import renderCanvas from "@/rendering/renderCanvas.ts";
import runWithCollageQueue from "@/services/collageQueue.ts";
import {
  getUserTopAlbums,
  getUserTopArtists,
  getUserTopTracks,
  type TopGridItem,
} from "@/services/lastfm/index.ts";
import type { BotContext } from "@/types/context.ts";
import {
  acceptedCollageParams,
  acceptedMedias,
  acceptedPeriods,
  collageParamMap,
  hasHdParam,
  type LastfmPeriod,
  mediaMap,
  type MediaType,
  periodInTextMap,
  periodMap,
} from "@/utils/validValuesMap.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import { InputFile } from "grammy";

const MAX_ROWS = 10;
const MIN_ROWS = 1;
const MAX_COLUMNS = 10;
const MIN_COLUMNS = 1;

const DEFAULT_GRID = "4x4";
const DEFAULT_MEDIA_TYPE: MediaType = "albums";
const DEFAULT_PERIOD: LastfmPeriod = "7day";
const GRID_REGEX = /^(\d+)x(\d+)$/;

function parseGridArgs(rawText: string) {
  const parts = rawText.trim().toLowerCase().split(/\s+/).slice(1);

  const grid = parts.find((arg) => GRID_REGEX.test(arg)) || DEFAULT_GRID;

  const mediaArg = parts.find((arg) =>
    (acceptedMedias as readonly string[]).includes(arg),
  );
  const media_type: MediaType = mediaArg
    ? mediaMap[mediaArg]
    : DEFAULT_MEDIA_TYPE;

  const periodArg = parts.find((arg) =>
    (acceptedPeriods as readonly string[]).includes(arg),
  );
  const period: LastfmPeriod = periodArg
    ? periodMap[periodArg]
    : DEFAULT_PERIOD;

  const collageParamArg = parts.find((arg) =>
    (acceptedCollageParams as readonly string[]).includes(arg),
  );
  const param = collageParamArg ? collageParamMap[collageParamArg] : null;

  const main = !parts.includes("nomain");

  return { grid, media_type, period, param, main };
}

function validateGrid(grid: string) {
  const match = grid.match(GRID_REGEX);
  if (!match) throw "GRID_INCORRECT_ARGS";

  const columns = Number(match[1]);
  const rows = Number(match[2]);

  if (
    columns > MAX_COLUMNS ||
    columns < MIN_COLUMNS ||
    rows > MAX_ROWS ||
    rows < MIN_ROWS
  ) {
    throw "GRID_INCORRECT_ARGS";
  }

  return { columns, rows };
}

async function fetchTopGridData(
  lastfm_user: string,
  media_type: MediaType,
  period: LastfmPeriod,
  limit: number,
): Promise<TopGridItem[]> {
  if (media_type === "tracks") {
    return await getUserTopTracks(lastfm_user, period, limit);
  }
  if (media_type === "albums") {
    return await getUserTopAlbums(lastfm_user, period, limit);
  }
  return await getUserTopArtists(lastfm_user, period, limit);
}

export default async function handleGridlf(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("gridlf", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const lastfm_user = await getLastfmUser(telegram_id);
    if (!lastfm_user) {
      throw "USER_NOT_FOUND";
    }

    const rawText = ctx.message?.text || "";
    const { grid, media_type, period, param, main: rawMain } =
      parseGridArgs(rawText);
    const { columns, rows } = validateGrid(grid);

    const firstLarge = columns <= 2 && rows <= 2 ? false : rawMain;
    const itemsNeeded = firstLarge
      ? Math.max(1, columns * rows - 3)
      : columns * rows;

    const tip = new FormattedString(`Generating your ${grid} grid...\n\n`)
      .bold("⏰ It may take a while\n\n")
      .italic(
        "💡 Tip: you can define your grid, type of media, period, or clean style:\n\n",
      )
      .plain("➡️ Examples:\n")
      .code("/gridlf 4x1 tracks 3m")
      .plain("\n")
      .code("/gridlf 5x3 art 6m")
      .plain("\n")
      .code("/gridlf 6x6 clean all")
      .plain("\n")
      .code("/gridlf 4x4 notitles 7d")
      .plain("\n")
      .code("/gridlf 5x5 noplays nomain 1y");

    await runWithCollageQueue(ctx, tip, async () => {
      const lastfm_data = await fetchTopGridData(
        lastfm_user,
        media_type,
        period,
        itemsNeeded,
      );

      if (!lastfm_data || lastfm_data.length === 0) {
        throw "ZERO_SCROBBLES";
      }

      const isHd = hasHdParam(ctx.message?.text || "");
      await ctx.replyWithChatAction(isHd ? "upload_document" : "upload_photo");

      const template = gridlfTemplate({
        lastfm_data,
        columns,
        rows,
        media_type,
        param,
        firstLarge,
      });

      const canvasBuffer = await renderCanvas(template);

      const displayName = ctx.from?.first_name || ctx.from?.username || "User";
      const periodLabel = periodInTextMap[period] || period;
      const caption =
        `${displayName}, your ${grid} ${media_type} grid of ${periodLabel}`;

      const ext = template.format === "png" ? "png" : "jpg";
      const filename = `grid_${grid}_${media_type}.${ext}`;

      if (isHd) {
        await ctx.replyWithDocument(new InputFile(canvasBuffer, filename), {
          caption,
          reply_parameters: ctx.message
            ? { message_id: ctx.message.message_id }
            : undefined,
        });
      } else {
        // Telegram sendPhoto has a strict 10MB limit. Fallback to sendDocument if it exceeds 10MB.
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

