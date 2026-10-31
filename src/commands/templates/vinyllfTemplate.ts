import type {
  CanvasElement,
  CanvasTemplateData,
  GlassEffectOptions,
} from "@/rendering/renderCanvas.ts";
import {
  createGlassPillElement,
  createImageElement,
  createRectangleElement,
  createTextElement,
  createVinylDiscElement,
  DEFAULT_GLASS_OPTIONS,
  getTextLines,
  measureText,
} from "@/rendering/renderCanvas.ts";
import { createWatermarkElements } from "@/rendering/watermark.ts";
import type { MediaType } from "@/utils/validValuesMap.ts";

export type VinylMediaData = {
  track?: string;
  album?: string;
  artist: string;
  userplaycount: number;
  image: string;
  isNowPlaying?: boolean;
};

export type VinyllfTemplateParams = {
  lastfm_data: VinylMediaData;
  media_type: MediaType;
  glassOptions?: GlassEffectOptions;
};

const VINYL_GLASS_OPTIONS: GlassEffectOptions = {
  ...DEFAULT_GLASS_OPTIONS,
  light: {
    angle: -45,
    intensity: 0.58,
  },
  refraction: 2.0,
  depth: 5,
  dispersion: 0.35,
  frost: 1,
  tint: {
    color: "#000000",
    opacity: 0.10,
  },
  shadow: {
    color: "rgba(0, 0, 0, 0.14)",
    opacity: 0.14,
    blur: 10,
    offsetX: 0,
    offsetY: 2,
  },
};

export function vinyllfTemplate({
  lastfm_data,
  media_type,
  glassOptions,
}: VinyllfTemplateParams): CanvasTemplateData {
  const width = 1080;
  const height = 1080;
  const centerX = width / 2;

  const effectiveGlassOptions: GlassEffectOptions = {
    ...VINYL_GLASS_OPTIONS,
    ...glassOptions,
  };

  const elements: CanvasElement[] = [];

  // 1. Blurred cover background: stronger blur + darker vignette
  if (lastfm_data.image) {
    const bleed = 140;
    elements.push(
      createImageElement({
        src: lastfm_data.image,
        x: -bleed,
        y: -bleed,
        width: width + bleed * 2,
        height: height + bleed * 2,
        objectFit: "cover",
        filter: "blur(88px) saturate(150%) brightness(0.84)",
        opacity: 0.78,
      }),
      createRectangleElement({
        x: 0,
        y: 0,
        width,
        height,
        fillStyle: {
          type: "radialGradient",
          x0: 320,
          y0: 210,
          r0: 30,
          x1: centerX,
          y1: 540,
          r1: 860,
          colors: [
            { stop: 0, color: "rgba(10, 10, 10, 0.38)" },
            { stop: 0.5, color: "rgba(10, 10, 10, 0.72)" },
            { stop: 1, color: "rgba(8, 8, 8, 0.94)" },
          ],
        },
      }),
    );
  }

  // Extract metadata strings
  let primaryTitle = "";
  let secondarySubtitle = "";
  let labelSubtitle = "";

  if (media_type === "tracks") {
    primaryTitle = lastfm_data.track || "Track";
    const parts = [lastfm_data.artist, lastfm_data.album].filter(Boolean);
    secondarySubtitle = parts.join(" — ");
    labelSubtitle = lastfm_data.artist || "";
  } else if (media_type === "albums") {
    primaryTitle = lastfm_data.album || "Album";
    secondarySubtitle = lastfm_data.artist || "";
    labelSubtitle = lastfm_data.artist || "";
  } else {
    primaryTitle = lastfm_data.artist || "Artist";
    labelSubtitle = "Artist";
  }

  // Horizontal geometry for sleeve and protruding vinyl disc
  const sleeveSize = 510;
  const vinylDiameter = 490;
  const vinylRadius = vinylDiameter / 2;
  const vinylProtrusionPastSleeve = 94 + vinylRadius; // 339px protruding to the right
  const totalSceneWidth = sleeveSize + vinylProtrusionPastSleeve; // 849px
  const sceneStartX = Math.round((width - totalSceneWidth) / 2);
  const contentMaxWidth = width - 2 * sceneStartX;

  // Header section
  const headerStatusText = lastfm_data.isNowPlaying
    ? "listening to:"
    : "listened to:";
  const headerStatusFont = '64px "NotoSans-Bold", sans-serif';
  const headerBaselineY = 112;

  elements.push(
    createTextElement({
      text: headerStatusText,
      x: sceneStartX,
      y: headerBaselineY,
      font: headerStatusFont,
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: contentMaxWidth,
      maxLines: 1,
    }),
  );

  // Spacing below "listening to:" before the track/album title
  const titleFontSize = primaryTitle.length > 34 ? 32 : 38;
  const titleLineHeight = Math.round(titleFontSize * 1.18);
  const titleFont = `${titleFontSize}px "NotoSans-Bold", sans-serif`;
  const titleLines = Math.max(
    1,
    getTextLines(primaryTitle, contentMaxWidth, 2, titleFont).length,
  );
  const titleFirstLineY = headerBaselineY + 54;
  const titleBaselineY = titleFirstLineY + (titleLines - 1) * titleLineHeight;

  elements.push(
    createTextElement({
      text: primaryTitle,
      x: sceneStartX,
      y: titleBaselineY,
      font: titleFont,
      fillStyle: "#ffffff",
      align: "left",
      maxWidth: contentMaxWidth,
      maxLines: 2,
      lineHeight: titleLineHeight,
    }),
  );

  let headerBottomY = titleBaselineY;

  if (secondarySubtitle) {
    const subtitleFontSize = 24;
    const subtitleLineHeight = 30;
    const subtitleFont = `${subtitleFontSize}px "NotoSans-Regular", sans-serif`;
    const subtitleLines = Math.max(
      1,
      getTextLines(secondarySubtitle, contentMaxWidth, 1, subtitleFont).length,
    );
    const subtitleBaselineY =
      headerBottomY + 34 + (subtitleLines - 1) * subtitleLineHeight;

    elements.push(
      createTextElement({
        text: secondarySubtitle,
        x: sceneStartX,
        y: subtitleBaselineY,
        font: subtitleFont,
        fillStyle: "rgba(255, 255, 255, 0.72)",
        align: "left",
        maxWidth: contentMaxWidth,
        maxLines: 1,
        lineHeight: subtitleLineHeight,
      }),
    );

    headerBottomY = subtitleBaselineY;
  }

  // 3. Glass capsule with scrobbles count positioned right below the header titles
  const scrobbles = (Number(lastfm_data.userplaycount) || 0) + 1;
  const scrobblesText = `${scrobbles.toLocaleString("pt-BR")} ${scrobbles === 1 ? "scrobble" : "scrobbles"
    }`;
  const pillFontSize = 21;
  const pillFont = `${pillFontSize}px "NotoSans-Bold", sans-serif`;
  const pillTextWidth = measureText(scrobblesText, pillFont).width;
  const pillHeight = 38;
  const pillPaddingX = 18;
  const pillWidth = Math.max(120, pillTextWidth + pillPaddingX * 2);
  const pillX = sceneStartX;
  const pillY = headerBottomY + 20;
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
      y: pillCenterY + pillFontSize * 0.35,
      font: pillFont,
      fillStyle: "rgba(255, 255, 255, 1)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.25)",
        offsetX: 0,
        offsetY: 1,
        blur: 3,
      },
      maxWidth: pillWidth - 12,
      maxLines: 1,
      lineHeight: pillFontSize,
      vibrancy: "primary",
    }),
  );

  headerBottomY = pillY + pillHeight;

  // Vertically center the sleeve and vinyl scene
  const stageTopBound = headerBottomY + 26;
  const stageBottomBound = height - 90; // above watermark
  const sleeveY = Math.max(
    stageTopBound,
    Math.round(
      stageTopBound + (stageBottomBound - stageTopBound - sleeveSize) / 2,
    ),
  );
  const sleeveX = sceneStartX;
  const sleeveRadius = 10;

  // Vinyl record disc (drawn before sleeve so it appears emerging from inside)
  const vinylCx = sleeveX + sleeveSize + 94;
  const vinylCy = sleeveY + sleeveSize / 2;

  elements.push(
    createVinylDiscElement({
      cx: vinylCx,
      cy: vinylCy,
      diameter: vinylDiameter,
      labelTitle: primaryTitle,
      labelSubtitle,
      labelRotation: -10,
      shadow: {
        color: "rgba(0, 0, 0, 0.58)",
        blur: 38,
        offsetX: 6,
        offsetY: 16,
      },
    }),
  );

  // Vinyl jacket sleeve casting shadow over the record
  elements.push(
    createRectangleElement({
      x: sleeveX,
      y: sleeveY,
      width: sleeveSize,
      height: sleeveSize,
      borderRadius: sleeveRadius,
      fillStyle: "#141414",
      shadow: {
        color: "rgba(0, 0, 0, 0.76)",
        blur: 38,
        offsetX: 18,
        offsetY: 12,
      },
    }),
  );

  if (lastfm_data.image) {
    elements.push(
      createImageElement({
        src: lastfm_data.image,
        x: sleeveX,
        y: sleeveY,
        width: sleeveSize,
        height: sleeveSize,
        borderRadius: sleeveRadius,
        objectFit: "cover",
      }),
    );
  }

  // 7. Bottom Watermark with soft shadow
  elements.push(
    ...createWatermarkElements({
      canvasWidth: width,
      canvasHeight: height,
      bottomOffset: 30,
      glassOptions: {
        ...effectiveGlassOptions,
        shadow: {
          color: "rgba(0, 0, 0, 0.14)",
          opacity: 0.14,
          blur: 8,
          offsetX: 0,
          offsetY: 2,
        },
      },
    }),
  );

  return {
    type: "lastfm-vinyl",
    width,
    height,
    background: "#080808",
    format: "jpeg",
    elements,
  };
}

export default vinyllfTemplate;
