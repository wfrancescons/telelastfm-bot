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
  frost: 2,
  tint: {
    color: "#000000",
    opacity: 0.30,
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

  // Exact horizontal geometry so [Sleeve + Protruding Vinyl] has identical 60px left & right margins:
  // Highlighted Sleeve (Encarte): 576x576 (x: 60..636)
  // Vinyl Disc sliding out from inside the sleeve: diameter 556 (radius 278), center at x = 742 (x: 464..1020)
  // Total scene width: 1020 - 60 = 960px -> left margin = 60px, right margin = 60px
  const sleeveSize = 576;
  const vinylDiameter = 556;
  const vinylRadius = vinylDiameter / 2;
  const vinylProtrusionPastSleeve = 106 + vinylRadius; // 384px protruding to the right
  const totalSceneWidth = sleeveSize + vinylProtrusionPastSleeve; // 960px
  const sceneStartX = Math.round((width - totalSceneWidth) / 2); // 60px
  const contentMaxWidth = totalSceneWidth; // 960px

  // 2. Left-aligned Header Section at the top
  const headerStatusText = lastfm_data.isNowPlaying
    ? "listening to:"
    : "listened to:";
  const headerStatusFont = '84px "NotoSans-Bold", sans-serif';
  const headerBaselineY = 148;

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

  // Increased spacing below "listening to:" before the track/album title
  const titleFontSize = primaryTitle.length > 34 ? 38 : 44;
  const titleLineHeight = Math.round(titleFontSize * 1.18);
  const titleFont = `${titleFontSize}px "NotoSans-Bold", sans-serif`;
  const titleLines = Math.max(
    1,
    getTextLines(primaryTitle, contentMaxWidth, 2, titleFont).length,
  );
  const titleFirstLineY = headerBaselineY + 74;
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
    const subtitleFontSize = 28;
    const subtitleLineHeight = 36;
    const subtitleFont = `${subtitleFontSize}px "NotoSans-Regular", sans-serif`;
    const subtitleLines = Math.max(
      1,
      getTextLines(secondarySubtitle, contentMaxWidth, 1, subtitleFont).length,
    );
    const subtitleBaselineY =
      headerBottomY + 40 + (subtitleLines - 1) * subtitleLineHeight;

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

  // 3. Vertically center the [Sleeve + Vinyl] scene between the header and the bottom watermark
  const stageTopBound = headerBottomY + 34;
  const stageBottomBound = height - 92; // above watermark
  const sleeveY = Math.max(
    stageTopBound,
    Math.round(
      stageTopBound + (stageBottomBound - stageTopBound - sleeveSize) / 2,
    ),
  );
  const sleeveX = sceneStartX;
  const sleeveRadius = 10;

  // 4. Simulated Vinyl Record Disc (drawn FIRST so it slides out from INSIDE the sleeve)
  const vinylCx = sleeveX + sleeveSize + 106;
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

  // 5. Highlighted Vinyl Jacket Sleeve (Encarte) drawn ON TOP of the vinyl's left side,
  //    casting a deep realistic shadow onto the record emerging from inside it
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

  // 6. Hype Sticker: Glass capsule positioned at the bottom-left of the sleeve
  const scrobbles = (Number(lastfm_data.userplaycount) || 0) + 1;
  const scrobblesText = `${scrobbles.toLocaleString("pt-BR")} ${
    scrobbles === 1 ? "scrobble" : "scrobbles"
  }`;
  const stickerFontSize = 23;
  const stickerFont = `${stickerFontSize}px "NotoSans-Bold", sans-serif`;
  const stickerTextWidth = measureText(scrobblesText, stickerFont).width;
  const stickerHeight = 46;
  const stickerPaddingX = 24;
  const stickerWidth = Math.max(140, stickerTextWidth + stickerPaddingX * 2);
  const stickerMargin = 22;
  const stickerX = sleeveX + stickerMargin;
  const stickerY = sleeveY + sleeveSize - stickerMargin - stickerHeight;
  const stickerCenterY = stickerY + stickerHeight / 2;

  elements.push(
    createGlassPillElement({
      x: stickerX,
      y: stickerY,
      width: stickerWidth,
      height: stickerHeight,
      options: effectiveGlassOptions,
    }),
    createTextElement({
      text: scrobblesText,
      x: stickerX + stickerWidth / 2,
      y: stickerCenterY + stickerFontSize * 0.35,
      font: stickerFont,
      fillStyle: "rgba(255, 255, 255, 1)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.25)",
        offsetX: 0,
        offsetY: 1,
        blur: 3,
      },
      maxWidth: stickerWidth - 12,
      maxLines: 1,
      lineHeight: stickerFontSize,
      vibrancy: "primary",
    }),
  );

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
