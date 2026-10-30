import type {
  CanvasElement,
  CanvasTemplateData,
  GlassEffectOptions,
  ImageElement,
  MediaControlIconElement,
  RectangleElement,
  TextElement,
} from "@/rendering/renderCanvas.ts";
import { getTextLines, measureText } from "@/rendering/renderCanvas.ts";
import type { MediaType } from "@/utils/validValuesMap.ts";
import {
  createGlassCircleElement,
  createGlassPillElement,
  DEFAULT_GLASS_OPTIONS,
} from "./gridlfTemplate.ts";

export type StoryMediaData = {
  track?: string;
  album?: string;
  artist: string;
  userplaycount: number;
  image: string;
};

export type StorylfTemplateParams = {
  lastfm_data: StoryMediaData;
  media_type: MediaType;
  glassOptions?: GlassEffectOptions;
};

const STORY_GLASS_OPTIONS: GlassEffectOptions = {
  ...DEFAULT_GLASS_OPTIONS,
  light: {
    angle: -45,
    intensity: 0.65,
  },
  refraction: 2.2,
  depth: 8,
  dispersion: 0.45,
  frost: 2.5,
  tint: {
    color: "#000000",
    opacity: 0.18,
  },
  shadow: {
    color: "#000000",
    opacity: 0.28,
    blur: 16,
    offsetX: 0,
    offsetY: 4,
  },
};

function createImageElement(params: {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  objectFit?: "fill" | "cover";
}): ImageElement {
  return { type: "image", ...params };
}

function createRectangleElement(params: {
  fillStyle?: RectangleElement["fillStyle"];
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

function createMediaControlIcon(params: {
  icon: MediaControlIconElement["icon"];
  cx: number;
  cy: number;
  size: number;
  fillStyle?: string;
}): MediaControlIconElement {
  return {
    type: "mediaControlIcon",
    ...params,
    fillStyle: params.fillStyle ?? "#ffffff",
    shadow: {
      color: "rgba(0, 0, 0, 0.45)",
      offsetX: 0,
      offsetY: 2,
      blur: 6,
    },
  };
}

export function storylfTemplate({
  lastfm_data,
  media_type,
  glassOptions,
}: StorylfTemplateParams): CanvasTemplateData {
  const width = 1080;
  const height = 1920;
  const centerX = width / 2;
  const mergedGlassOptions: GlassEffectOptions = {
    ...STORY_GLASS_OPTIONS,
    ...glassOptions,
  };

  const elements: CanvasElement[] = [];

  // 1. Full-screen cover / artist image (1080x1920 center-cropped)
  if (lastfm_data.image) {
    elements.push(
      createImageElement({
        src: lastfm_data.image,
        x: 0,
        y: 0,
        width,
        height,
        objectFit: "cover",
      }),
    );
  }

  // 2. Smooth neutral dark-gray gradient overlay (same #0E0E0E tone as letterboxdgram-bot)
  const gradientHeight = 1180;
  const gradientTopY = height - gradientHeight;
  elements.push(
    createRectangleElement({
      fillStyle: {
        type: "linearGradient",
        colors: [
          { stop: 0, color: "rgba(14, 14, 14, 0)" },
          { stop: 0.35, color: "rgba(14, 14, 14, 0.3)" },
          { stop: 0.72, color: "rgba(14, 14, 14, 0.68)" },
          { stop: 1, color: "rgba(14, 14, 14, 0.88)" },
        ],
        x0: 0,
        y0: gradientTopY,
        x1: 0,
        y1: height,
      },
      x: 0,
      y: gradientTopY,
      width,
      height: gradientHeight,
    }),
  );

  // 3. Scrobbles count inside a glass pill badge
  const scrobbles = (Number(lastfm_data.userplaycount) || 0) + 1;
  const scrobblesText = `${scrobbles.toLocaleString("pt-BR")} ${
    scrobbles === 1 ? "scrobble" : "scrobbles"
  }`;
  const pillFontSize = 30;
  const pillFont = `${pillFontSize}px "NotoSans-Medium", sans-serif`;
  const pillTextWidth = measureText(scrobblesText, pillFont).width;
  const pillHeight = 64;
  const pillPaddingX = 34;
  const pillWidth = Math.max(pillHeight, pillTextWidth + pillPaddingX * 2);
  const pillCenterY = 1095;
  const pillX = centerX - pillWidth / 2;
  const pillY = pillCenterY - pillHeight / 2;

  elements.push(
    createGlassPillElement({
      x: pillX,
      y: pillY,
      width: pillWidth,
      height: pillHeight,
      options: mergedGlassOptions,
    }),
  );

  elements.push(
    createTextElement({
      text: scrobblesText,
      x: centerX,
      y: pillCenterY + pillFontSize * 0.35,
      font: pillFont,
      fillStyle: "rgba(255, 255, 255, 0.72)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.4)",
        offsetX: 0,
        offsetY: 2,
        blur: 6,
      },
      maxWidth: pillWidth - 20,
      maxLines: 2,
      lineHeight: pillFontSize,
    }),
  );

  // 4. Media titles (Track / Album / Artist) with max 2 lines each
  const maxTextWidth = 920;

  if (media_type === "tracks") {
    const titleFont = `52px "NotoSans-Bold", sans-serif`;
    const titleLineHeight = 60;
    const titleLines = Math.max(
      1,
      getTextLines(lastfm_data.track || "", maxTextWidth, 2, titleFont).length,
    );
    const titleFirstLineY = 1220;
    const titleBaselineY =
      titleFirstLineY + (titleLines - 1) * titleLineHeight;

    elements.push(
      createTextElement({
        text: lastfm_data.track || "",
        x: centerX,
        y: titleBaselineY,
        font: titleFont,
        fillStyle: "#ffffff",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.65)",
          offsetX: 2,
          offsetY: 2,
          blur: 8,
        },
        maxWidth: maxTextWidth,
        maxLines: 2,
        lineHeight: titleLineHeight,
      }),
    );

    let currentLastLineY = titleBaselineY;

    if (lastfm_data.album) {
      const albumFont = `34px "NotoSans-Regular", sans-serif`;
      const albumLineHeight = 40;
      const albumLines = Math.max(
        1,
        getTextLines(lastfm_data.album, maxTextWidth, 2, albumFont).length,
      );
      const albumFirstLineY = currentLastLineY + 48;
      const albumBaselineY =
        albumFirstLineY + (albumLines - 1) * albumLineHeight;

      elements.push(
        createTextElement({
          text: lastfm_data.album,
          x: centerX,
          y: albumBaselineY,
          font: albumFont,
          fillStyle: "rgba(255, 255, 255, 0.78)",
          align: "center",
          shadow: {
            color: "rgba(0, 0, 0, 0.55)",
            offsetX: 2,
            offsetY: 2,
            blur: 6,
          },
          maxWidth: maxTextWidth,
          maxLines: 2,
          lineHeight: albumLineHeight,
        }),
      );
      currentLastLineY = albumBaselineY;
    }

    const artistFont = `30px "NotoSans-Regular", sans-serif`;
    const artistLineHeight = 36;
    const artistLines = Math.max(
      1,
      getTextLines(lastfm_data.artist || "", maxTextWidth, 2, artistFont).length,
    );
    const artistFirstLineY = currentLastLineY + 42;
    const artistBaselineY =
      artistFirstLineY + (artistLines - 1) * artistLineHeight;

    elements.push(
      createTextElement({
        text: lastfm_data.artist,
        x: centerX,
        y: artistBaselineY,
        font: artistFont,
        fillStyle: "rgba(255, 255, 255, 0.65)",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.55)",
          offsetX: 1,
          offsetY: 1,
          blur: 6,
        },
        maxWidth: maxTextWidth,
        maxLines: 2,
        lineHeight: artistLineHeight,
      }),
    );
  } else if (media_type === "albums") {
    const titleFont = `54px "NotoSans-Bold", sans-serif`;
    const titleLineHeight = 62;
    const titleLines = Math.max(
      1,
      getTextLines(lastfm_data.album || "", maxTextWidth, 2, titleFont).length,
    );
    const titleFirstLineY = 1235;
    const titleBaselineY =
      titleFirstLineY + (titleLines - 1) * titleLineHeight;

    elements.push(
      createTextElement({
        text: lastfm_data.album || "",
        x: centerX,
        y: titleBaselineY,
        font: titleFont,
        fillStyle: "#ffffff",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.65)",
          offsetX: 2,
          offsetY: 2,
          blur: 8,
        },
        maxWidth: maxTextWidth,
        maxLines: 2,
        lineHeight: titleLineHeight,
      }),
    );

    const artistFont = `36px "NotoSans-Regular", sans-serif`;
    const artistLineHeight = 42;
    const artistLines = Math.max(
      1,
      getTextLines(lastfm_data.artist || "", maxTextWidth, 2, artistFont).length,
    );
    const artistFirstLineY = titleBaselineY + 52;
    const artistBaselineY =
      artistFirstLineY + (artistLines - 1) * artistLineHeight;

    elements.push(
      createTextElement({
        text: lastfm_data.artist,
        x: centerX,
        y: artistBaselineY,
        font: artistFont,
        fillStyle: "rgba(255, 255, 255, 0.72)",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.55)",
          offsetX: 2,
          offsetY: 2,
          blur: 6,
        },
        maxWidth: maxTextWidth,
        maxLines: 2,
        lineHeight: artistLineHeight,
      }),
    );
  } else {
    const titleFont = `60px "NotoSans-Bold", sans-serif`;
    const titleLineHeight = 70;
    const titleLines = Math.max(
      1,
      getTextLines(lastfm_data.artist || "", maxTextWidth, 2, titleFont).length,
    );
    const titleFirstLineY = 1265;
    const titleBaselineY =
      titleFirstLineY + (titleLines - 1) * titleLineHeight;

    elements.push(
      createTextElement({
        text: lastfm_data.artist,
        x: centerX,
        y: titleBaselineY,
        font: titleFont,
        fillStyle: "#ffffff",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.65)",
          offsetX: 2,
          offsetY: 2,
          blur: 8,
        },
        maxWidth: maxTextWidth,
        maxLines: 2,
        lineHeight: titleLineHeight,
      }),
    );
  }

  // 5. Playback progress bar
  const barWidth = 820;
  const barHeight = 10;
  const barX = centerX - barWidth / 2;
  const barY = 1500;
  const progressRatio = 0.36;

  elements.push(
    createRectangleElement({
      x: barX,
      y: barY,
      width: barWidth,
      height: barHeight,
      borderRadius: barHeight / 2,
      fillStyle: "rgba(255, 255, 255, 0.24)",
    }),
  );

  elements.push(
    createRectangleElement({
      x: barX,
      y: barY,
      width: Math.round(barWidth * progressRatio),
      height: barHeight,
      borderRadius: barHeight / 2,
      fillStyle: "#ffffff",
    }),
  );

  // 6. Media controls with circular glass shapes
  const controlsY = 1655;
  const sideControlOffset = 215;
  const sideDiameter = 112;
  const centerDiameter = 156;

  // Previous button (left glass circle + icon)
  elements.push(
    createGlassCircleElement({
      cx: centerX - sideControlOffset,
      cy: controlsY,
      diameter: sideDiameter,
      options: mergedGlassOptions,
    }),
  );
  elements.push(
    createMediaControlIcon({
      icon: "prev",
      cx: centerX - sideControlOffset,
      cy: controlsY,
      size: 40,
    }),
  );

  // Pause/Play button (center glass circle + icon)
  elements.push(
    createGlassCircleElement({
      cx: centerX,
      cy: controlsY,
      diameter: centerDiameter,
      options: mergedGlassOptions,
    }),
  );
  elements.push(
    createMediaControlIcon({
      icon: "pause",
      cx: centerX,
      cy: controlsY,
      size: 60,
    }),
  );

  // Next button (right glass circle + icon)
  elements.push(
    createGlassCircleElement({
      cx: centerX + sideControlOffset,
      cy: controlsY,
      diameter: sideDiameter,
      options: mergedGlassOptions,
    }),
  );
  elements.push(
    createMediaControlIcon({
      icon: "next",
      cx: centerX + sideControlOffset,
      cy: controlsY,
      size: 40,
    }),
  );

  // 7. Subtle watermark at the bottom
  elements.push(
    createTextElement({
      text: "@telelastfmbot",
      x: centerX,
      y: 1850,
      font: `24px "NotoSans-Regular", sans-serif`,
      fillStyle: "rgba(255, 255, 255, 0.55)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.5)",
        offsetX: 1,
        offsetY: 1,
        blur: 4,
      },
      maxWidth: 400,
      maxLines: 2,
      lineHeight: 24,
    }),
  );

  return {
    type: "lastfm-story",
    width,
    height,
    background: "#0E0E0E",
    elements,
  };
}

export default storylfTemplate;
