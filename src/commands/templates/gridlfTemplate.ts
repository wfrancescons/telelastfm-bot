import type {
  CanvasElement,
  CanvasTemplateData,
  GlassEffectOptions,
} from "@/rendering/renderCanvas.ts";
import {
  createGlassCircleElement,
  createGlassPillElement,
  createGradientRectangle,
  createImageElement,
  createRectangleElement,
  createTextElement,
  DEFAULT_GLASS_OPTIONS,
  getTextLines,
  measureText,
} from "@/rendering/renderCanvas.ts";
import type {
  TopAlbumItem,
  TopArtistItem,
  TopGridItem,
  TopTrackItem,
} from "@/services/lastfm/index.ts";
import { collageParamMap, type MediaType } from "@/utils/validValuesMap.ts";

export {
  createGlassCircleElement,
  createGlassPillElement,
  DEFAULT_GLASS_OPTIONS
};

export type GridTemplateConfig = {
  POSTER_WIDTH: number;
  POSTER_HEIGHT: number;
  GRADIENT_HEIGHT: number;
  TEXT_PADDING: number;
  TEXT_LINE_HEIGHT: number;
  SUBTITLE_LINE_HEIGHT: number;
  TITLE_FONT_SIZE: number;
  SUBTITLE_FONT_SIZE: number;
  SCROBBLE_FONT_SIZE: number;
  PILL_HEIGHT: number;
  PILL_PADDING_X: number;
  BOTTOM_MARGIN: number;
  PILL_TEXT_GAP: number;
};

function extractItemTexts(
  item: TopGridItem,
  mediaType: MediaType,
): { title: string; subtitle: string | null; scrobblesText: string } {
  const count = Number(item.scrobbles) || 0;
  const scrobblesText = `${count.toLocaleString("pt-BR")} ${count === 1 ? "scrobble" : "scrobbles"
    }`;

  if (mediaType === "tracks") {
    const t = item as TopTrackItem;
    return {
      title: t.track.name,
      subtitle: t.track.artist,
      scrobblesText,
    };
  }

  if (mediaType === "albums") {
    const a = item as TopAlbumItem;
    return {
      title: a.album.name,
      subtitle: a.album.artist,
      scrobblesText,
    };
  }

  const ar = item as TopArtistItem;
  return {
    title: ar.artist.name,
    subtitle: null,
    scrobblesText,
  };
}

function generateTileElements(
  item: TopGridItem,
  x: number,
  y: number,
  width: number,
  height: number,
  param: string | null,
  config: GridTemplateConfig,
  mediaType: MediaType,
  glassOptions?: GlassEffectOptions,
): CanvasElement[] {
  const padding = config.TEXT_PADDING;
  const lineHeight = config.TEXT_LINE_HEIGHT;
  const subtitleLineHeight = config.SUBTITLE_LINE_HEIGHT;
  const titleFontSize = config.TITLE_FONT_SIZE;
  const subtitleFontSize = config.SUBTITLE_FONT_SIZE;
  const scrobbleFontSize = config.SCROBBLE_FONT_SIZE;
  const pillHeight = config.PILL_HEIGHT;
  const pillPaddingX = config.PILL_PADDING_X;
  const bottomMargin = config.BOTTOM_MARGIN;
  const gradientHeight = config.GRADIENT_HEIGHT;

  const elements: CanvasElement[] = [];

  if (item.image) {
    elements.push(
      createImageElement({
        src: item.image,
        x,
        y,
        width,
        height,
        objectFit: "cover",
      }),
    );
  } else {
    elements.push(
      createRectangleElement({
        fillStyle: "rgba(0, 0, 0, 0.5)",
        x,
        y,
        width,
        height,
      }),
    );
  }

  const normalizedParam = param ? collageParamMap[param] ?? param : null;
  const isClean = normalizedParam === "notexts";
  if (isClean) {
    return elements;
  }

  const { title, subtitle, scrobblesText } = extractItemTexts(item, mediaType);
  const isNoTitles = normalizedParam === "notitles";
  const isNoPlays = normalizedParam === "noplays";

  const pillCenterY = y + height - bottomMargin - pillHeight / 2;

  // Mode: notitles -> only the glass pill with scrobble count
  if (isNoTitles) {
    elements.push(
      createGradientRectangle({
        x,
        y,
        width,
        height,
        gradientHeight: 90,
      }),
    );

    const scrobbleFont = `${scrobbleFontSize}px "NotoSans-Medium", sans-serif`;
    const textWidth = measureText(scrobblesText, scrobbleFont).width;
    const pillWidth = Math.min(
      width - 2 * padding,
      Math.max(pillHeight, textWidth + pillPaddingX * 2),
    );
    const pillX = x + padding;
    const pillY = pillCenterY - pillHeight / 2;

    elements.push(
      createGlassPillElement({
        x: pillX,
        y: pillY,
        width: pillWidth,
        height: pillHeight,
        options: glassOptions,
      }),
    );

    elements.push(
      createTextElement({
        text: scrobblesText,
        x: pillX + pillWidth / 2,
        y: pillCenterY + scrobbleFontSize * 0.35,
        font: scrobbleFont,
        fillStyle: "rgba(255, 255, 255, 0.85)",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.35)",
          offsetX: 0,
          offsetY: 1,
          blur: 4,
        },
        maxWidth: pillWidth - 8,
        maxLines: 2,
        lineHeight: scrobbleFontSize,
        vibrancy: "primary"
      }),
    );

    return elements;
  }

  // Default or noplays mode
  elements.push(
    createGradientRectangle({
      x,
      y,
      width,
      height,
      gradientHeight,
    }),
  );

  let currentBottomY = y + height - bottomMargin;

  if (!isNoPlays) {
    const scrobbleFont = `${scrobbleFontSize}px "NotoSans-Medium", sans-serif`;
    const textWidth = measureText(scrobblesText, scrobbleFont).width;
    const pillWidth = Math.min(
      width - 2 * padding,
      Math.max(pillHeight, textWidth + pillPaddingX * 2),
    );
    const pillX = x + padding;
    const pillY = pillCenterY - pillHeight / 2;

    elements.push(
      createGlassPillElement({
        x: pillX,
        y: pillY,
        width: pillWidth,
        height: pillHeight,
        options: glassOptions,
      }),
    );

    elements.push(
      createTextElement({
        text: scrobblesText,
        x: pillX + pillWidth / 2,
        y: pillCenterY + scrobbleFontSize * 0.35,
        font: scrobbleFont,
        fillStyle: "rgba(255, 255, 255, 0.85)",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.35)",
          offsetX: 0,
          offsetY: 1,
          blur: 4,
        },
        maxWidth: pillWidth - 8,
        maxLines: 2,
        lineHeight: scrobbleFontSize,
        vibrancy: "primary"
      }),
    );

    currentBottomY = pillY - config.PILL_TEXT_GAP;
  }

  const maxWidth = width - 2 * padding;

  // Subtitle (artist name for tracks & albums) using NotoSans-Regular with lower opacity
  if (subtitle) {
    const subtitleFont = `${subtitleFontSize}px "NotoSans-Medium", sans-serif`;
    const subtitleLinesCount = Math.max(
      1,
      getTextLines(subtitle, maxWidth, 2, subtitleFont).length,
    );

    elements.push(
      createTextElement({
        text: subtitle,
        x: x + padding,
        y: currentBottomY,
        font: subtitleFont,
        fillStyle: "rgba(255, 255, 255, 0.75)",
        shadow: {
          color: "rgba(0, 0, 0, 0.6)",
          offsetX: 1,
          offsetY: 1,
          blur: 3,
        },
        maxWidth,
        maxLines: 2,
        lineHeight: subtitleLineHeight,
      }),
    );

    const firstSubtitleLineY =
      currentBottomY - (subtitleLinesCount - 1) * subtitleLineHeight;
    currentBottomY = firstSubtitleLineY - subtitleFontSize - 6;
  }

  // Primary Title (track, album, or artist name) using NotoSans-Bold
  const titleFont = `${titleFontSize}px "NotoSans-Bold", sans-serif`;

  elements.push(
    createTextElement({
      text: title,
      x: x + padding,
      y: currentBottomY,
      font: titleFont,
      fillStyle: "#ffffff",
      shadow: {
        color: "rgba(0, 0, 0, 0.65)",
        offsetX: 2,
        offsetY: 2,
        blur: 4,
      },
      maxWidth,
      maxLines: 2,
      lineHeight,
      vibrancy: "primary"
    }),
  );

  return elements;
}

export type GridlfTemplateParams = {
  lastfm_data: TopGridItem[];
  columns: number;
  rows: number;
  media_type: MediaType;
  param?: string | null;
  firstLarge?: boolean;
  glassOptions?: GlassEffectOptions;
};

export function gridlfTemplate({
  lastfm_data,
  columns,
  rows,
  media_type,
  param = null,
  firstLarge = false,
  glassOptions,
}: GridlfTemplateParams): CanvasTemplateData {
  const config: GridTemplateConfig = {
    POSTER_WIDTH: 250,
    POSTER_HEIGHT: 250,
    GRADIENT_HEIGHT: 155,
    TEXT_PADDING: 14,
    TEXT_LINE_HEIGHT: 18,
    SUBTITLE_LINE_HEIGHT: 17,
    TITLE_FONT_SIZE: 14,
    SUBTITLE_FONT_SIZE: 12,
    SCROBBLE_FONT_SIZE: 13,
    PILL_HEIGHT: 25,
    PILL_PADDING_X: 11,
    BOTTOM_MARGIN: 12,
    PILL_TEXT_GAP: 10,
  };

  const data: CanvasTemplateData = {
    type: "lastfm-grid",
    width: columns * config.POSTER_WIDTH,
    height: rows * config.POSTER_HEIGHT,
    background: "#0E0E0E",
    elements: [],
  };

  if (firstLarge && lastfm_data.length > 0) {
    const firstItem = lastfm_data[0];
    const firstElements = generateTileElements(
      firstItem,
      0,
      0,
      2 * config.POSTER_WIDTH,
      2 * config.POSTER_HEIGHT,
      param,
      config,
      media_type,
      glassOptions,
    );
    data.elements.push(...firstElements);
  }

  let index = firstLarge ? 1 : 0;
  let x = firstLarge ? 2 * config.POSTER_WIDTH : 0;
  let y = 0;

  while (index < lastfm_data.length) {
    if (x >= columns * config.POSTER_WIDTH) {
      x = 0;
      y += config.POSTER_HEIGHT;
    }

    if (firstLarge && x === 0 && y < 2 * config.POSTER_HEIGHT) {
      x = 2 * config.POSTER_WIDTH;
    }

    if (y >= rows * config.POSTER_HEIGHT) {
      break;
    }

    const item = lastfm_data[index];
    const tileElements = generateTileElements(
      item,
      x,
      y,
      config.POSTER_WIDTH,
      config.POSTER_HEIGHT,
      param,
      config,
      media_type,
      glassOptions,
    );
    data.elements.push(...tileElements);

    x += config.POSTER_WIDTH;
    index++;
  }

  return data;
}

export default gridlfTemplate;
