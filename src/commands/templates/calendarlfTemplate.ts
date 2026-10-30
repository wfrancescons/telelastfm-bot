import {
  createGlassCircleElement,
  createGlassPillElement,
  DEFAULT_GLASS_OPTIONS,
} from "@/commands/templates/gridlfTemplate.ts";
import { isPlaceholderImageUrl } from "@/database/services/imageCache.ts";
import type {
  CanvasElement,
  CanvasTemplateData,
  GlassEffectOptions,
  ImageElement,
  RectangleElement,
  TextElement,
} from "@/rendering/renderCanvas.ts";
import { measureText } from "@/rendering/renderCanvas.ts";
import type { CalendarDayItem } from "@/services/lastfm/index.ts";
import type { MediaType } from "@/utils/validValuesMap.ts";

const ENGLISH_MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getSubtitleByMediaType(mediaType: MediaType): string {
  if (mediaType === "tracks") return "top tracks of";
  if (mediaType === "artists") return "top artists of";
  return "top albums of";
}

function findFirstBackgroundCover(
  daysData: Map<number, CalendarDayItem>,
  daysInMonth: number,
): string | null {
  let firstAny: string | null = null;
  for (let d = 1; d <= daysInMonth; d++) {
    const item = daysData.get(d);
    if (!item?.image) continue;
    if (!firstAny) firstAny = item.image;
    if (!isPlaceholderImageUrl(item.image)) {
      return item.image;
    }
  }
  return firstAny && !isPlaceholderImageUrl(firstAny) ? firstAny : null;
}

function createImageElement(params: {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  objectFit?: "fill" | "cover";
  filter?: string;
  opacity?: number;
}): ImageElement {
  return { type: "image", ...params };
}

function createRectangleElement(params: {
  fillStyle?: RectangleElement["fillStyle"];
  style?: RectangleElement["style"];
  borderRadius?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}): RectangleElement {
  return { type: "rectangle", ...params };
}

function createTextElement(params: {
  text: string;
  x: number;
  y: number;
  font: string;
  fillStyle: string;
  align?: TextElement["align"];
  shadow?: {
    color?: string;
    offsetX?: number;
    offsetY?: number;
    blur?: number;
  };
  maxWidth?: number;
  maxLines?: number;
  lineHeight?: number;
}): TextElement {
  return { type: "text", ...params };
}

export type CalendarlfTemplateParams = {
  year: number;
  monthIndex: number; // 0 = January .. 11 = December
  media_type: MediaType;
  daysData: Map<number, CalendarDayItem>;
  param?: string | null;
  glassOptions?: GlassEffectOptions;
};

export function calendarlfTemplate({
  year,
  monthIndex,
  media_type,
  daysData,
  param = null,
  glassOptions,
}: CalendarlfTemplateParams): CanvasTemplateData {
  const canvasWidth = 1080;
  const canvasHeight = 1080;

  const elements: CanvasElement[] = [];

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 (Sun) .. 6 (Sat)
  const totalWeeks = Math.ceil((firstDayOfWeek + daysInMonth) / 7);

  const effectiveGlassOptions: GlassEffectOptions = {
    ...DEFAULT_GLASS_OPTIONS,
    ...glassOptions,
  };

  // Background: first valid cover image blurred + radial darkening overlay,
  // or fallback to the dark radial spotlight
  const bgCover = findFirstBackgroundCover(daysData, daysInMonth);
  if (bgCover) {
    const bleed = 120;
    elements.push(
      createImageElement({
        src: bgCover,
        x: -bleed,
        y: -bleed,
        width: canvasWidth + bleed * 2,
        height: canvasHeight + bleed * 2,
        objectFit: "cover",
        filter: "blur(72px) saturate(145%)",
        opacity: 0.72,
      }),
      createRectangleElement({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        fillStyle: {
          type: "radialGradient",
          x0: canvasWidth / 2,
          y0: 135,
          r0: 20,
          x1: canvasWidth / 2,
          y1: 420,
          r1: 720,
          colors: [
            { stop: 0, color: "rgba(14, 14, 14, 0.42)" },
            { stop: 0.45, color: "rgba(14, 14, 14, 0.72)" },
            { stop: 1, color: "rgba(10, 10, 10, 0.92)" },
          ],
        },
      }),
    );
  } else {
    elements.push(
      createRectangleElement({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: 450,
        fillStyle: {
          type: "radialGradient",
          x0: canvasWidth / 2,
          y0: 110,
          r0: 10,
          x1: canvasWidth / 2,
          y1: 150,
          r1: 420,
          colors: [
            { stop: 0, color: "rgba(255, 255, 255, 0.08)" },
            { stop: 0.55, color: "rgba(255, 255, 255, 0.03)" },
            { stop: 1, color: "rgba(14, 14, 14, 0)" },
          ],
        },
      }),
    );
  }

  // Header Suggestion: Glass eyebrow badge ("top * of") with subtle flanking lines + "<month> <year>"
  const headerSubtitle = getSubtitleByMediaType(media_type);
  const subtitleFont = '19px "NotoSans-Medium", sans-serif';
  const subtitleTextWidth = measureText(headerSubtitle, subtitleFont).width;
  const headerPillHeight = 34;
  const headerPillWidth = subtitleTextWidth + 40;
  const headerPillX = (canvasWidth - headerPillWidth) / 2;
  const headerPillY = 40;
  const headerPillCenterY = headerPillY + headerPillHeight / 2;
  const lineLength = 70;
  const lineGap = 14;

  // Left and right subtle gradient accent lines flanking the glass eyebrow pill
  elements.push(
    createRectangleElement({
      x: headerPillX - lineGap - lineLength,
      y: headerPillCenterY - 1,
      width: lineLength,
      height: 2,
      fillStyle: {
        type: "linearGradient",
        x0: headerPillX - lineGap - lineLength,
        y0: headerPillCenterY,
        x1: headerPillX - lineGap,
        y1: headerPillCenterY,
        colors: [
          { stop: 0, color: "rgba(255, 255, 255, 0)" },
          { stop: 1, color: "rgba(255, 255, 255, 0.28)" },
        ],
      },
    }),
    createRectangleElement({
      x: headerPillX + headerPillWidth + lineGap,
      y: headerPillCenterY - 1,
      width: lineLength,
      height: 2,
      fillStyle: {
        type: "linearGradient",
        x0: headerPillX + headerPillWidth + lineGap,
        y0: headerPillCenterY,
        x1: headerPillX + headerPillWidth + lineGap + lineLength,
        y1: headerPillCenterY,
        colors: [
          { stop: 0, color: "rgba(255, 255, 255, 0.28)" },
          { stop: 1, color: "rgba(255, 255, 255, 0)" },
        ],
      },
    }),
    createGlassPillElement({
      x: headerPillX,
      y: headerPillY,
      width: headerPillWidth,
      height: headerPillHeight,
      options: effectiveGlassOptions,
    }),
    createTextElement({
      text: headerSubtitle,
      x: canvasWidth / 2,
      y: headerPillCenterY + 6.5,
      font: subtitleFont,
      fillStyle: "rgba(255, 255, 255, 0.9)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.35)",
        offsetX: 0,
        offsetY: 1,
        blur: 4,
      },
      maxWidth: headerPillWidth - 16,
      maxLines: 1,
    }),
  );

  // Header main title: "<month> <year>" centered with bold white month and regular muted year
  const monthName = ENGLISH_MONTHS[monthIndex] || "month";
  const yearText = String(year);
  const monthFont = '64px "NotoSans-Bold", sans-serif';
  const yearFont = '64px "NotoSans-Regular", sans-serif';
  const gapBetweenMonthAndYear = 18;

  const monthWidth = measureText(monthName, monthFont).width;
  const yearWidth = measureText(yearText, yearFont).width;
  const totalTitleWidth = monthWidth + gapBetweenMonthAndYear + yearWidth;
  const titleStartX = (canvasWidth - totalTitleWidth) / 2;
  const titleBaselineY = 144;

  elements.push(
    createTextElement({
      text: monthName,
      x: titleStartX,
      y: titleBaselineY,
      font: monthFont,
      fillStyle: "#ffffff",
      align: "left",
      shadow: {
        color: "rgba(0, 0, 0, 0.45)",
        offsetX: 0,
        offsetY: 2,
        blur: 8,
      },
      maxWidth: 700,
      maxLines: 1,
    }),
    createTextElement({
      text: yearText,
      x: titleStartX + monthWidth + gapBetweenMonthAndYear,
      y: titleBaselineY,
      font: yearFont,
      fillStyle: "rgba(255, 255, 255, 0.48)",
      align: "left",
      shadow: {
        color: "rgba(0, 0, 0, 0.35)",
        offsetX: 0,
        offsetY: 2,
        blur: 8,
      },
      maxWidth: 400,
      maxLines: 1,
    }),
  );

  // Calendar grid geometry adjusted for 1080x1080 square
  const cellSize = totalWeeks === 6 ? 116 : 126;
  const cellGap = 10;
  const cellRadius = 12;
  const gridWidth = 7 * cellSize + 6 * cellGap;
  const gridHeight = totalWeeks * cellSize + (totalWeeks - 1) * cellGap;
  const gridStartX = Math.round((canvasWidth - gridWidth) / 2);

  // Center the weekday header + grid block vertically between header and footer
  const bodyTopY = 186;
  const bodyBottomY = 1018;
  const weekdayToGridGap = 20;
  const totalCalendarBlockHeight = weekdayToGridGap + gridHeight;
  const blockStartY =
    bodyTopY +
    Math.max(
      10,
      Math.floor((bodyBottomY - bodyTopY - totalCalendarBlockHeight) / 2),
    );

  const weekdayBaselineY = blockStartY;
  const gridStartY = blockStartY + weekdayToGridGap;

  // Weekday headers: S M T W T F S
  for (let col = 0; col < 7; col++) {
    const colCenterX = gridStartX + col * (cellSize + cellGap) + cellSize / 2;
    elements.push(
      createTextElement({
        text: WEEKDAY_LABELS[col],
        x: colCenterX,
        y: weekdayBaselineY,
        font: '18px "NotoSans-Medium", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.52)",
        align: "center",
        maxWidth: cellSize,
        maxLines: 1,
      }),
    );
  }

  const isClean =
    param === "notexts" ||
    param === "notext" ||
    param === "clean" ||
    param === "nonames" ||
    param === "nooverlay";
  const isNoTitles = param === "notitles" || param === "notitle";
  const isNoPlays = param === "noplays" || param === "noscrobbles";

  // Render all days 1..daysInMonth
  for (let day = 1; day <= daysInMonth; day++) {
    const slotIndex = firstDayOfWeek + day - 1;
    const col = slotIndex % 7;
    const row = Math.floor(slotIndex / 7);

    const cellX = gridStartX + col * (cellSize + cellGap);
    const cellY = gridStartY + row * (cellSize + cellGap);

    const dayItem = daysData.get(day);

    const badgeDiameter = 28;
    const badgeMargin = 8;
    const badgeCx = cellX + badgeMargin + badgeDiameter / 2;
    const badgeCy = cellY + badgeMargin + badgeDiameter / 2;
    const dayFont = '12px "NotoSans-Bold", sans-serif';
    const dayBadgeGlassOptions: GlassEffectOptions = {
      ...effectiveGlassOptions,
      frost: 2,
    };

    if (dayItem && dayItem.image) {
      // 1. Cover / Artist Image
      elements.push(
        createImageElement({
          src: dayItem.image,
          x: cellX,
          y: cellY,
          width: cellSize,
          height: cellSize,
          borderRadius: cellRadius,
          objectFit: "cover",
        }),
      );

      // 2. Bottom dark gradient overlay (unless in clean/notexts mode)
      if (!isClean) {
        const gradHeight = isNoTitles ? 48 : isNoPlays ? 58 : 70;
        elements.push(
          createRectangleElement({
            x: cellX,
            y: cellY + cellSize - gradHeight,
            width: cellSize,
            height: gradHeight,
            borderRadius: cellRadius,
            fillStyle: {
              type: "linearGradient",
              x0: cellX,
              y0: cellY + cellSize - gradHeight,
              x1: cellX,
              y1: cellY + cellSize,
              colors: [
                { stop: 0, color: "rgba(14, 14, 14, 0)" },
                { stop: 0.5, color: "rgba(14, 14, 14, 0.28)" },
                { stop: 1, color: "rgba(14, 14, 14, 0.62)" },
              ],
            },
          }),
        );
      }

      // 3. Day number inside glass circle (top-left, always visible)
      elements.push(
        createGlassCircleElement({
          cx: badgeCx,
          cy: badgeCy,
          diameter: badgeDiameter,
          options: dayBadgeGlassOptions,
        }),
        createTextElement({
          text: String(day),
          x: badgeCx,
          y: badgeCy + 4.5,
          font: dayFont,
          fillStyle: "#ffffff",
          align: "center",
          shadow: {
            color: "rgba(0, 0, 0, 0.45)",
            offsetX: 0,
            offsetY: 1,
            blur: 3,
          },
          maxWidth: badgeDiameter,
          maxLines: 1,
        }),
      );

      if (isClean) {
        continue;
      }

      const cellPadding = 8;
      const bottomMargin = 7;
      const maxContentWidth = cellSize - cellPadding * 2;
      let currentBottomY = cellY + cellSize - bottomMargin;

      // 4. Scrobble glass pill (shown in default and notitles modes)
      if (!isNoPlays) {
        const pillHeight = 17;
        const pillPaddingX = 6;
        const count = Number(dayItem.scrobbles) || 0;
        const scrobblesText = `${count.toLocaleString("pt-BR")} ${count === 1 ? "scrobble" : "scrobbles"
          }`;
        const scrobbleFontSize = 8.5;
        const scrobbleFont =
          `${scrobbleFontSize}px "NotoSans-Medium", sans-serif`;

        const textWidth = measureText(scrobblesText, scrobbleFont).width;
        const pillWidth = Math.min(
          maxContentWidth,
          Math.max(pillHeight, textWidth + pillPaddingX * 2),
        );
        const pillX = cellX + cellPadding;
        const pillY = cellY + cellSize - bottomMargin - pillHeight;
        const pillCenterY = pillY + pillHeight / 2;

        elements.push(
          createGlassPillElement({
            x: pillX,
            y: pillY,
            width: pillWidth,
            height: pillHeight,
            options: effectiveGlassOptions,
          }),
          createTextElement({
            text: scrobblesText,
            x: pillX + pillWidth / 2,
            y: pillCenterY + scrobbleFontSize * 0.35,
            font: scrobbleFont,
            fillStyle: "rgba(255, 255, 255, 0.88)",
            align: "center",
            shadow: {
              color: "rgba(0, 0, 0, 0.35)",
              offsetX: 0,
              offsetY: 1,
              blur: 3,
            },
            maxWidth: pillWidth - 6,
            maxLines: 1,
            lineHeight: scrobbleFontSize,
          }),
        );

        currentBottomY = pillY - 5;
      }

      // 5. Title (shown in default and noplays modes)
      if (!isNoTitles) {
        const titleFontSize = 10;
        const titleLineHeight = 12;
        const titleFont = `${titleFontSize}px "NotoSans-Bold", sans-serif`;

        elements.push(
          createTextElement({
            text: dayItem.title,
            x: cellX + cellPadding,
            y: currentBottomY,
            font: titleFont,
            fillStyle: "#ffffff",
            shadow: {
              color: "rgba(0, 0, 0, 0.7)",
              offsetX: 1,
              offsetY: 1,
              blur: 3,
            },
            maxWidth: maxContentWidth,
            maxLines: 2,
            lineHeight: titleLineHeight,
          }),
        );
      }
    } else {
      // Day without scrobbles: do NOT render an image, keep the day of the month visible
      elements.push(
        createRectangleElement({
          x: cellX,
          y: cellY,
          width: cellSize,
          height: cellSize,
          borderRadius: cellRadius,
          fillStyle: "rgba(255, 255, 255, 0.035)",
        }),
        createGlassCircleElement({
          cx: badgeCx,
          cy: badgeCy,
          diameter: badgeDiameter,
          options: dayBadgeGlassOptions,
        }),
        createTextElement({
          text: String(day),
          x: badgeCx,
          y: badgeCy + 4.5,
          font: dayFont,
          fillStyle: "rgba(255, 255, 255, 0.75)",
          align: "center",
          maxWidth: badgeDiameter,
          maxLines: 1,
        }),
      );
    }
  }

  // Footer: t.me/telelastfmbot
  elements.push(
    createTextElement({
      text: "t.me/telelastfmbot",
      x: canvasWidth / 2,
      y: 1048,
      font: '16px "NotoSans-Medium", sans-serif',
      fillStyle: "rgba(255, 255, 255, 0.48)",
      align: "center",
      maxWidth: 600,
      maxLines: 1,
    }),
  );

  return {
    type: "lastfm-calendar",
    width: canvasWidth,
    height: canvasHeight,
    background: "#0E0E0E",
    elements,
  };
}

export default calendarlfTemplate;
