import type {
  CanvasElement,
  CanvasTemplateData,
  GlassEffectOptions,
} from "@/rendering/renderCanvas.ts";
import {
  createGlassCircleElement,
  createGlassPillElement,
  createImageElement,
  createMediaControlIcon,
  createRectangleElement,
  createTextElement,
  DEFAULT_GLASS_OPTIONS,
  getTextLines,
  measureText,
} from "@/rendering/renderCanvas.ts";
import { createWatermarkElements } from "@/rendering/watermark.ts";
import type { MediaType } from "@/utils/validValuesMap.ts";

export type StoryMediaData = {
  track?: string;
  album?: string;
  artist: string;
  userplaycount: number;
  image: string;
  isNowPlaying?: boolean;
};

export type StorylfTemplateParams = {
  lastfm_data: StoryMediaData;
  media_type: MediaType;
  glassOptions?: GlassEffectOptions;
};

// Softer, more refined glass options style
const STORY_GLASS_OPTIONS: GlassEffectOptions = {
  ...DEFAULT_GLASS_OPTIONS,
  light: {
    angle: -45,
    intensity: 0.6,
  },
  refraction: 2.0,
  depth: 6,
  dispersion: 0.35,
  frost: 2.2,
  tint: {
    color: "#ffffff",
    opacity: 0.08,
  },
  shadow: {
    color: "rgba(0, 0, 0, 0.22)",
    opacity: 0.22,
    blur: 16,
    offsetX: 0,
    offsetY: 5,
  },
};

export function storylfTemplate({
  lastfm_data,
  media_type,
  glassOptions,
}: StorylfTemplateParams): CanvasTemplateData {
  const width = 1080;
  const height = 1920;
  const centerX = width / 2;
  const contentWidth = 860;
  const mergedGlassOptions: GlassEffectOptions = {
    ...STORY_GLASS_OPTIONS,
    ...glassOptions,
  };

  const elements: CanvasElement[] = [];

  // 1. Dynamic background: heavily blurred cover (fluid mesh gradient effect)
  if (lastfm_data.image) {
    elements.push(
      createImageElement({
        src: lastfm_data.image,
        x: -80,
        y: -80,
        width: 1240,
        height: 2080,
        objectFit: "cover",
        filter: "blur(90px) saturate(1.8) brightness(0.72)",
      }),
    );
  }

  // 2. Smooth dark scrim overlay
  elements.push(
    createRectangleElement({
      fillStyle: {
        type: "linearGradient",
        colors: [
          { stop: 0, color: "rgba(0, 0, 0, 0.1)" },
          { stop: 0.35, color: "rgba(0, 0, 0, 0.2)" },
          { stop: 0.65, color: "rgba(10, 10, 10, 0.65)" },
          { stop: 0.88, color: "rgba(10, 10, 10, 0.88)" },
          { stop: 1, color: "rgba(10, 10, 10, 0.96)" },
        ],
        x0: 0,
        y0: 0,
        x1: 0,
        y1: height,
      },
      x: 0,
      y: 0,
      width,
      height,
    }),
  );

  // 3. Floating album artwork card
  const cardSize = 740;
  const cardX = (width - cardSize) / 2;
  const cardY = 230;

  if (lastfm_data.image) {
    // Soft ambient shadow behind artwork card
    elements.push(
      createRectangleElement({
        x: cardX,
        y: cardY,
        width: cardSize,
        height: cardSize,
        borderRadius: 38,
        fillStyle: "rgba(0, 0, 0, 0.25)",
        shadow: {
          color: "rgba(0, 0, 0, 0.3)",
          blur: 50,
          offsetX: 0,
          offsetY: 24,
        },
      }),
    );

    // Floating cover image with rounded corners
    elements.push(
      createImageElement({
        src: lastfm_data.image,
        x: cardX,
        y: cardY,
        width: cardSize,
        height: cardSize,
        borderRadius: 38,
        objectFit: "cover",
      }),
    );
  }

  // 4. Track / Album / Artist metadata
  const titleFontSize = 50;
  const titleLineHeight = 58;
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

  const titleFirstLineY = 1055;
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
        color: "rgba(0, 0, 0, 0.28)",
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
    const subtitleFontSize = 30;
    const subtitleLineHeight = 38;
    const subtitleFont = `${subtitleFontSize}px "NotoSans-Regular", sans-serif`;
    const subtitleLines = Math.max(
      1,
      getTextLines(secondarySubtitle, contentWidth, 2, subtitleFont).length,
    );
    const subtitleFirstLineY = currentY + 42;
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
          color: "rgba(0, 0, 0, 0.22)",
          offsetX: 0,
          offsetY: 1,
          blur: 6,
        },
        maxWidth: contentWidth,
        maxLines: 2,
        lineHeight: subtitleLineHeight,
      }),
    );

    currentY = subtitleBaselineY;
  }

  // 5. Scrobbles Capsule
  const scrobbles = (Number(lastfm_data.userplaycount) || 0) + 1;
  const scrobblesText = `${scrobbles.toLocaleString("pt-BR")} ${scrobbles === 1 ? "scrobble" : "scrobbles"
    }`;
  const pillFontSize = 26;
  const pillFont = `${pillFontSize}px "NotoSans-Medium", sans-serif`;
  const pillTextWidth = measureText(scrobblesText, pillFont).width;
  const pillHeight = 58;
  const pillPaddingX = 32;
  const pillWidth = Math.max(160, pillTextWidth + pillPaddingX * 2);
  const pillCenterY = currentY + 58;
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
      fillStyle: "rgba(255, 255, 255, 0.92)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.25)",
        offsetX: 0,
        offsetY: 1,
        blur: 4,
      },
      maxWidth: pillWidth - 16,
      maxLines: 1,
      lineHeight: pillFontSize,
    }),
  );

  // 6. Progress bar (clean, sleek)
  const barWidth = 840;
  const barHeight = 8;
  const barX = centerX - barWidth / 2;
  const barY = pillY + pillHeight + 54;
  const progressRatio = 0.42;

  // Background track
  elements.push(
    createRectangleElement({
      x: barX,
      y: barY,
      width: barWidth,
      height: barHeight,
      borderRadius: barHeight / 2,
      fillStyle: "rgba(255, 255, 255, 0.22)",
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

  // 7. Media controls with circular glass shapes
  const controlsY = barY + 120;
  const sideControlOffset = 210;
  const sideDiameter = 104;
  const centerDiameter = 146;

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
      size: 38,
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
      size: 54,
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
      size: 38,
    }),
  );

  // 8. Watermark at the bottom: Glass pill with Telegram logo + t.me/<botusername>
  elements.push(
    ...createWatermarkElements({
      canvasWidth: width,
      canvasHeight: height,
      bottomOffset: 80,
      glassOptions: mergedGlassOptions,
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
