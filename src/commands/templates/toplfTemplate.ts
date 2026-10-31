import { isPlaceholderImageUrl } from "@/database/services/imageCache.ts";
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
  measureText,
} from "@/rendering/renderCanvas.ts";
import { createWatermarkElements } from "@/rendering/watermark.ts";
import {
  DEFAULT_IMAGE,
  type UserProfileData,
} from "@/services/lastfm/index.ts";
import type { LastfmPeriod } from "@/utils/validValuesMap.ts";

export type ToplfTemplateParams = {
  profileData: UserProfileData;
  period?: LastfmPeriod;
  fallbackDisplayName?: string;
  fallbackAvatarUrl?: string | null;
  glassOptions?: GlassEffectOptions;
};

const TOPLF_GLASS_OPTIONS: GlassEffectOptions = {
  ...DEFAULT_GLASS_OPTIONS,
  refraction: 0.72,
  depth: 6,
  dispersion: 0.07,
  frost: 4,
  tint: {
    color: "#000000",
    opacity: 0.22,
  },
  shadow: {
    color: "rgba(0, 0, 0, 0.14)",
    opacity: 0.14,
    blur: 10,
    offsetX: 0,
    offsetY: 3,
  },
};

function pickBackgroundCover(
  profileData: UserProfileData,
  avatarUrl: string,
): string | null {
  // Priority: User Avatar -> Top Artist -> Top Album -> Top Track
  const candidates = [
    avatarUrl,
    profileData.topArtists[0]?.image,
    profileData.topAlbums[0]?.image,
    profileData.topTracks[0]?.image,
  ];

  for (const url of candidates) {
    if (url && !isPlaceholderImageUrl(url)) {
      return url;
    }
  }
  return candidates[0] || null;
}

export function getPeriodHeadline(period: LastfmPeriod = "7day"): {
  pillSubtitle: string;
  headlinePeriod: string;
} {
  const pillSubtitle = "top scrobbles of";

  switch (period) {
    case "7day":
      return { pillSubtitle, headlinePeriod: "last 7 days" };
    case "1month":
      return { pillSubtitle, headlinePeriod: "last month" };
    case "3month":
      return { pillSubtitle, headlinePeriod: "last 3 months" };
    case "6month":
      return { pillSubtitle, headlinePeriod: "last 6 months" };
    case "12month":
      return { pillSubtitle, headlinePeriod: "last year" };
    case "overall":
    default:
      return { pillSubtitle, headlinePeriod: "all time" };
  }
}

export function toplfTemplate({
  profileData,
  period = "7day",
  fallbackAvatarUrl,
  glassOptions,
}: ToplfTemplateParams): CanvasTemplateData {
  // 9:16 aspect ratio: 760 x 1350
  const width = 760;
  const height = 1350;
  const centerX = width / 2;

  const effectiveGlassOptions: GlassEffectOptions = {
    ...TOPLF_GLASS_OPTIONS,
    ...glassOptions,
  };

  const elements: CanvasElement[] = [];

  const avatarUrl =
    profileData.avatar ||
    fallbackAvatarUrl ||
    profileData.topArtists[0]?.image ||
    DEFAULT_IMAGE;

  // Background: blurred cover + dark vignette overlay
  const bgCover = pickBackgroundCover(profileData, avatarUrl);
  if (bgCover) {
    const bleed = 100;
    elements.push(
      createImageElement({
        src: bgCover,
        x: -bleed,
        y: -bleed,
        width: width + bleed * 2,
        height: height + bleed * 2,
        objectFit: "cover",
        filter: "blur(82px) saturate(155%) brightness(0.80)",
        opacity: 0.76,
      }),
      createRectangleElement({
        x: 0,
        y: 0,
        width,
        height,
        fillStyle: {
          type: "radialGradient",
          x0: 534,
          y0: 520,
          r0: 30,
          x1: centerX,
          y1: 675,
          r1: 830,
          colors: [
            { stop: 0, color: "rgba(10, 10, 10, 0.36)" },
            { stop: 0.52, color: "rgba(10, 10, 10, 0.74)" },
            { stop: 1, color: "rgba(8, 8, 8, 0.94)" },
          ],
        },
      }),
    );
  }

  // Header: left-aligned glass pill and period headline
  const leftMargin = 50;
  const { pillSubtitle, headlinePeriod } = getPeriodHeadline(period);

  const subtitleFont = '19px "NotoSans-Medium", sans-serif';
  const subtitleTextWidth = measureText(pillSubtitle, subtitleFont).width;
  const headerPillHeight = 36;
  const headerPillWidth = Math.round(subtitleTextWidth + 36);
  const headerPillX = leftMargin;
  const headerPillY = 82;
  const headerPillCenterY = headerPillY + headerPillHeight / 2;

  elements.push(
    createGlassPillElement({
      x: headerPillX,
      y: headerPillY,
      width: headerPillWidth,
      height: headerPillHeight,
      options: {
        ...effectiveGlassOptions,
        tint: {
          color: "#000000",
          opacity: 0.35,
        },
      },
    }),
    createTextElement({
      text: pillSubtitle,
      x: headerPillX + headerPillWidth / 2,
      y: headerPillCenterY + 6.5,
      font: subtitleFont,
      fillStyle: "rgba(255, 255, 255, 0.92)",
      align: "center",
      shadow: {
        color: "rgba(0, 0, 0, 0.4)",
        offsetX: 0,
        offsetY: 1,
        blur: 4,
      },
      maxWidth: headerPillWidth - 12,
      maxLines: 1,
      vibrancy: "primary",
    }),
  );

  const periodTitleY = headerPillY + headerPillHeight + 55;
  elements.push(
    createTextElement({
      text: headlinePeriod,
      x: leftMargin,
      y: periodTitleY,
      font: '48px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: width - leftMargin * 2,
      maxLines: 1,
    }),
  );

  // Main content: top lists and right-side artwork
  const artSize = 300;
  const artX = width - leftMargin - artSize; // 760 - 50 - 300 = 410
  const cardRadius = 18;

  const topArtistCover =
    profileData.topArtists[0]?.image ||
    profileData.topAlbums[0]?.image ||
    DEFAULT_IMAGE;
  const topAlbumCover =
    profileData.topAlbums[0]?.image ||
    profileData.topTracks[0]?.image ||
    DEFAULT_IMAGE;
  const topTrackItem = profileData.topTracks[0];
  const topTrackTitle = topTrackItem?.track?.name || "Track";
  const topTrackArtist = topTrackItem?.track?.artist || "";
  const topTrackCover =
    topTrackItem?.image ||
    profileData.topAlbums[0]?.image ||
    DEFAULT_IMAGE;

  // Vinyl disc at the bottom
  const vinylDiameter = artSize;
  const vinylCx = artX + artSize / 2;
  const vinylCy = 860 + artSize / 2;

  elements.push(
    createVinylDiscElement({
      cx: vinylCx,
      cy: vinylCy,
      diameter: vinylDiameter,
      labelImage: topTrackCover,
      labelTitle: topTrackTitle,
      labelSubtitle: topTrackArtist,
      labelRotation: -12,
      shadow: {
        color: "rgba(0, 0, 0, 0.45)",
        blur: 24,
        offsetX: 0,
        offsetY: 8,
      },
    }),
  );

  // Album cover art in the middle
  const albumCardY = 575;
  elements.push(
    createRectangleElement({
      x: artX,
      y: albumCardY,
      width: artSize,
      height: artSize,
      borderRadius: cardRadius,
      fillStyle: "#121212",
      shadow: {
        color: "rgba(0, 0, 0, 0.46)",
        blur: 24,
        offsetX: 0,
        offsetY: 8,
      },
    }),
    createImageElement({
      src: topAlbumCover,
      x: artX,
      y: albumCardY,
      width: artSize,
      height: artSize,
      borderRadius: cardRadius,
      objectFit: "cover",
    }),
  );

  // Circular artist photo on top
  const artistCircleY = 285;
  elements.push(
    createImageElement({
      src: topArtistCover,
      x: artX,
      y: artistCircleY,
      width: artSize,
      height: artSize,
      borderRadius: artSize / 2,
      objectFit: "cover",
      shadow: {
        color: "rgba(0, 0, 0, 0.55)",
        blur: 28,
        offsetX: 0,
        offsetY: 10,
      },
    }),
  );

  // Left column: Top 3 lists
  const listX = leftMargin;
  const itemTextX = listX + 34;
  const itemMaxWidth = artX - itemTextX - 22;

  // Top Artists section
  const artistsHeaderY = 365;
  elements.push(
    createTextElement({
      text: "Top Artists",
      x: listX,
      y: artistsHeaderY,
      font: '28px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: itemMaxWidth + 34,
      maxLines: 1,
    }),
  );

  for (let i = 0; i < 3; i++) {
    const item = profileData.topArtists[i];
    const rowY = artistsHeaderY + 46 + i * 42;
    const artistName = item?.artist?.name || "—";

    elements.push(
      createTextElement({
        text: String(i + 1),
        x: listX,
        y: rowY,
        font: '20px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.48)",
        align: "left",
        vibrancy: "secondary",
        maxWidth: 26,
        maxLines: 1,
      }),
      createTextElement({
        text: artistName,
        x: itemTextX,
        y: rowY,
        font: '20px "NotoSans-Bold", sans-serif',
        fillStyle: "#ffffff",
        align: "left",
        maxWidth: itemMaxWidth,
        maxLines: 1,
      }),
    );
  }

  // Top Albums section
  const albumsHeaderY = 615;
  elements.push(
    createTextElement({
      text: "Top Albums",
      x: listX,
      y: albumsHeaderY,
      font: '28px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: itemMaxWidth + 34,
      maxLines: 1,
    }),
  );

  for (let i = 0; i < 3; i++) {
    const item = profileData.topAlbums[i];
    const rowY = albumsHeaderY + 46 + i * 64;
    const albumName = item?.album?.name || "—";
    const artistName = item?.album?.artist || "";

    elements.push(
      createTextElement({
        text: String(i + 1),
        x: listX,
        y: rowY,
        font: '19px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.48)",
        align: "left",
        vibrancy: "secondary",
        maxWidth: 26,
        maxLines: 1,
      }),
      createTextElement({
        text: albumName,
        x: itemTextX,
        y: rowY,
        font: '19px "NotoSans-Bold", sans-serif',
        fillStyle: "#ffffff",
        align: "left",
        maxWidth: itemMaxWidth,
        maxLines: 1,
      }),
    );

    if (artistName) {
      elements.push(
        createTextElement({
          text: artistName,
          x: itemTextX,
          y: rowY + 23,
          font: '16px "NotoSans-Regular", sans-serif',
          fillStyle: "rgba(255, 255, 255, 0.62)",
          align: "left",
          maxWidth: itemMaxWidth,
          maxLines: 1,
        }),
      );
    }
  }

  // Top Scrobbles section
  const scrobblesHeaderY = 900;
  elements.push(
    createTextElement({
      text: "Top Scrobbles",
      x: listX,
      y: scrobblesHeaderY,
      font: '28px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: itemMaxWidth + 34,
      maxLines: 1,
    }),
  );

  for (let i = 0; i < 3; i++) {
    const item = profileData.topTracks[i];
    const rowY = scrobblesHeaderY + 46 + i * 64;
    const trackName = item?.track?.name || "—";
    const artistName = item?.track?.artist || "";

    elements.push(
      createTextElement({
        text: String(i + 1),
        x: listX,
        y: rowY,
        font: '19px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.48)",
        align: "left",
        vibrancy: "secondary",
        maxWidth: 26,
        maxLines: 1,
      }),
      createTextElement({
        text: trackName,
        x: itemTextX,
        y: rowY,
        font: '19px "NotoSans-Bold", sans-serif',
        fillStyle: "#ffffff",
        align: "left",
        maxWidth: itemMaxWidth,
        maxLines: 1,
      }),
    );

    if (artistName) {
      elements.push(
        createTextElement({
          text: artistName,
          x: itemTextX,
          y: rowY + 23,
          font: '16px "NotoSans-Regular", sans-serif',
          fillStyle: "rgba(255, 255, 255, 0.62)",
          align: "left",
          maxWidth: itemMaxWidth,
          maxLines: 1,
        }),
      );
    }
  }

  // Footer watermark
  elements.push(
    ...createWatermarkElements({
      canvasWidth: width,
      canvasHeight: height,
      bottomOffset: 36,
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
    type: "lastfm-top",
    width,
    height,
    background: "#080808",
    format: "jpeg",
    elements,
  };
}

export default toplfTemplate;
