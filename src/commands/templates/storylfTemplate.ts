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
    intensity: 0.7,
  },
  refraction: 2.5,
  depth: 9,
  dispersion: 0.45,
  frost: 2.8,
  tint: {
    color: "#000000",
    opacity: 0.22,
  },
  shadow: {
    color: "#000000",
    opacity: 0.4,
    blur: 20,
    offsetX: 0,
    offsetY: 8,
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
  const contentWidth = 900;
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

  // 2. Smooth neutral dark-gray gradient overlay (Apple Music dark player feel)
  const gradientHeight = 1300;
  const gradientTopY = height - gradientHeight;
  elements.push(
    createRectangleElement({
      fillStyle: {
        type: "linearGradient",
        colors: [
          { stop: 0, color: "rgba(14, 14, 14, 0)" },
          { stop: 0.25, color: "rgba(14, 14, 14, 0.42)" },
          { stop: 0.55, color: "rgba(14, 14, 14, 0.8)" },
          { stop: 0.82, color: "rgba(14, 14, 14, 0.95)" },
          { stop: 1, color: "rgba(14, 14, 14, 0.98)" },
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

  // 3. Track / Album / Artist metadata (Apple Music Player hierarchy)
  const titleFontSize = 58;
  const titleLineHeight = 66;
  const titleFont = `${titleFontSize}px "NotoSans-Bold", sans-serif`;

  let primaryTitle = "";
  let secondarySubtitle = "";

  if (media_type === "tracks") {
    primaryTitle = lastfm_data.track || "Track";
    const parts = [lastfm_data.artist, lastfm_data.album].filter(Boolean);
    secondarySubtitle = parts.join(" — ");
  } else if (media_type === "albums") {
    primaryTitle = lastfm_data.album || "Album";
    secondarySubtitle = lastfm_data.artist || "";
  } else {
    primaryTitle = lastfm_data.artist || "Artist";
    secondarySubtitle = "Top Artist";
  }

  const titleLines = Math.max(
    1,
    getTextLines(primaryTitle, contentWidth, 2, titleFont).length,
  );

  // Anchor title position
  const titleFirstLineY = 1110;
  const titleBaselineY = titleFirstLineY + (titleLines - 1) * titleLineHeight;

  elements.push(
    createTextElement({
      text: primaryTitle,
      x: centerX,
      y: titleBaselineY,
      font: titleFont,
      fillStyle: "#ffffff",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.65)",
        offsetX: 0,
        offsetY: 2,
        blur: 8,
      },
      maxWidth: contentWidth,
      maxLines: 2,
      lineHeight: titleLineHeight,
    }),
  );

  let currentY = titleBaselineY;

  // Subtitle (Artist — Album)
  if (secondarySubtitle) {
    const subtitleFontSize = 32;
    const subtitleLineHeight = 40;
    const subtitleFont = `${subtitleFontSize}px "NotoSans-Regular", sans-serif`;
    const subtitleLines = Math.max(
      1,
      getTextLines(secondarySubtitle, contentWidth, 2, subtitleFont).length,
    );
    const subtitleFirstLineY = currentY + 44;
    const subtitleBaselineY =
      subtitleFirstLineY + (subtitleLines - 1) * subtitleLineHeight;

    elements.push(
      createTextElement({
        text: secondarySubtitle,
        x: centerX,
        y: subtitleBaselineY,
        font: subtitleFont,
        fillStyle: "rgba(255, 255, 255, 0.72)",
        align: "center",
        shadow: {
          color: "rgba(0, 0, 0, 0.55)",
          offsetX: 0,
          offsetY: 2,
          blur: 6,
        },
        maxWidth: contentWidth,
        maxLines: 2,
        lineHeight: subtitleLineHeight,
      }),
    );

    currentY = subtitleBaselineY;
  }

  // 4. Scrobbles em GRANDE DESTAQUE (Opção B: Bloco/Widget com Número Gigante)
  const scrobbles = (Number(lastfm_data.userplaycount) || 0) + 1;
  const countText = scrobbles.toLocaleString("pt-BR");
  const labelText = scrobbles === 1 ? "SCROBBLE" : "SCROBBLES";

  const numFontSize = 62;
  const numFont = `${numFontSize}px "NotoSans-Bold", sans-serif`;
  const numTextWidth = measureText(countText, numFont).width;

  const labelFontSize = 18;
  const labelFont = `${labelFontSize}px "NotoSans-Medium", sans-serif`;
  const labelTextWidth = measureText(labelText, labelFont).width;

  const cardHeight = 138;
  const cardPaddingX = 48;
  const cardWidth = Math.max(
    260,
    Math.max(numTextWidth, labelTextWidth) + cardPaddingX * 2,
  );
  const cardX = centerX - cardWidth / 2;
  const cardY = currentY + 46;

  // Glass card widget
  elements.push(
    createRectangleElement({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      borderRadius: 32,
      style: {
        type: "glass",
        options: {
          ...mergedGlassOptions,
          depth: 10,
          refraction: 2.6,
          frost: 3,
        },
      },
    }),
  );

  // Big number
  elements.push(
    createTextElement({
      text: countText,
      x: centerX,
      y: cardY + 70,
      font: numFont,
      fillStyle: "#ffffff",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.45)",
        offsetX: 0,
        offsetY: 2,
        blur: 6,
      },
      maxWidth: cardWidth - 20,
      maxLines: 1,
      lineHeight: numFontSize,
    }),
  );

  // Subtitle label (SCROBBLES)
  elements.push(
    createTextElement({
      text: labelText,
      x: centerX,
      y: cardY + 110,
      font: labelFont,
      fillStyle: "rgba(255, 255, 255, 0.72)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.4)",
        offsetX: 0,
        offsetY: 1,
        blur: 4,
      },
      maxWidth: cardWidth - 20,
      maxLines: 1,
      lineHeight: labelFontSize,
    }),
  );

  // 5. Apple Music clean progress bar (sem minutagem abaixo)
  const barWidth = 860;
  const barHeight = 8;
  const barX = centerX - barWidth / 2;
  const barY = cardY + cardHeight + 56;
  const progressRatio = 0.42;

  // Background track
  elements.push(
    createRectangleElement({
      x: barX,
      y: barY,
      width: barWidth,
      height: barHeight,
      borderRadius: barHeight / 2,
      fillStyle: "rgba(255, 255, 255, 0.25)",
    }),
  );

  // Active progress track
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

  // 6. Media controls with circular glass shapes (Apple Music layout)
  const controlsY = barY + 130;
  const sideControlOffset = 210;
  const sideDiameter = 112;
  const centerDiameter = 154;

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

  // Pause button (center glass circle + icon)
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
      size: 58,
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

  // 7. Watermark at the bottom
  elements.push(
    createTextElement({
      text: "@telelastfmbot",
      x: centerX,
      y: 1845,
      font: `24px "NotoSans-Regular", sans-serif`,
      fillStyle: "rgba(255, 255, 255, 0.45)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.5)",
        offsetX: 0,
        offsetY: 1,
        blur: 4,
      },
      maxWidth: 400,
      maxLines: 1,
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
