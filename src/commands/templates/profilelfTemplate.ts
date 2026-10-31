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
} from "@/rendering/renderCanvas.ts";
import { createWatermarkElements } from "@/rendering/watermark.ts";
import {
  DEFAULT_AVATAR_IMAGE,
  DEFAULT_IMAGE,
  type UserProfileData,
} from "@/services/lastfm/index.ts";

export type ProfilelfTemplateParams = {
  profileData: UserProfileData;
  fallbackDisplayName?: string;
  fallbackAvatarUrl?: string | null;
  glassOptions?: GlassEffectOptions;
};

const PROFILE_GLASS_OPTIONS: GlassEffectOptions = {
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

export function profilelfTemplate({
  profileData,
  fallbackDisplayName,
  fallbackAvatarUrl,
  glassOptions,
}: ProfilelfTemplateParams): CanvasTemplateData {
  // Proporção 9:16 com altura máxima 1350px -> 760 x 1350
  const width = 760;
  const height = 1350;
  const centerX = width / 2;

  const effectiveGlassOptions: GlassEffectOptions = {
    ...PROFILE_GLASS_OPTIONS,
    ...glassOptions,
  };

  const elements: CanvasElement[] = [];

  const avatarUrl =
    profileData.avatar ||
    fallbackAvatarUrl ||
    profileData.topArtists[0]?.image ||
    DEFAULT_AVATAR_IMAGE;

  // 1. Blurred cover background + dark vignette overlay
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
          y0: 605,
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

  // 2. Top Header: Circular User Avatar Centralizado + Real Name e @username embaixo
  const leftMargin = 59;
  const avatarSize = 128;
  const avatarX = Math.round(centerX - avatarSize / 2);
  const avatarY = 38;

  elements.push(
    createImageElement({
      src: avatarUrl,
      x: avatarX,
      y: avatarY,
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
      objectFit: "cover",
      shadow: {
        color: "rgba(0, 0, 0, 0.28)",
        blur: 14,
        offsetX: 0,
        offsetY: 4,
      },
    }),
  );

  const displayName =
    profileData.realname || fallbackDisplayName || profileData.username;
  const handleText = `@${profileData.username}`;
  const headerTextMaxW = width - leftMargin * 2;

  elements.push(
    createTextElement({
      text: displayName,
      x: centerX,
      y: 204,
      font: '28px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "center",
      vibrancy: "primary",
      maxWidth: headerTextMaxW,
      maxLines: 1,
    }),
    createTextElement({
      text: handleText,
      x: centerX,
      y: 235,
      font: '19px "NotoSans-Regular", sans-serif',
      fillStyle: "rgba(255, 255, 255, 0.68)",
      align: "center",
      vibrancy: "secondary",
      maxWidth: headerTextMaxW,
      maxLines: 1,
    }),
  );

  // 3. Stats Section: Pill compacta abaixo do @username com divisores verticais
  const statsPillW = 472;
  const statsPillH = 66;
  const statsPillX = Math.round((width - statsPillW) / 2); // 144
  const statsPillY = 258;

  elements.push(
    createGlassPillElement({
      x: statsPillX,
      y: statsPillY,
      width: statsPillW,
      height: statsPillH,
      options: effectiveGlassOptions,
    }),
  );

  const colW = statsPillW / 3; // ~157.33px
  const statsItems = [
    {
      label: "SCROBBLES",
      value: profileData.scrobbles.toLocaleString("en-US"),
    },
    {
      label: "ARTISTS",
      value: profileData.artistsCount.toLocaleString("en-US"),
    },
    {
      label: "LOVED TRACKS",
      value: profileData.lovedTracksCount.toLocaleString("en-US"),
    },
  ];

  statsItems.forEach((stat, index) => {
    const colCenterX = statsPillX + index * colW + colW / 2;

    elements.push(
      createTextElement({
        text: stat.value,
        x: colCenterX,
        y: statsPillY + 30,
        font: '20px "NotoSans-Bold", sans-serif',
        fillStyle: "#ffffff",
        align: "center",
        vibrancy: "primary",
        maxWidth: colW - 14,
        maxLines: 1,
      }),
      createTextElement({
        text: stat.label,
        x: colCenterX,
        y: statsPillY + 51,
        font: '11px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.56)",
        align: "center",
        vibrancy: "secondary",
        maxWidth: colW - 14,
        maxLines: 1,
      }),
    );

    if (index > 0) {
      const dividerX = Math.round(statsPillX + index * colW);
      elements.push(
        createRectangleElement({
          x: dividerX,
          y: statsPillY + 14,
          width: 1.5,
          height: statsPillH - 28,
          fillStyle: "rgba(255, 255, 255, 0.16)",
        }),
      );
    }
  });

  // 4. Right Column: Overlapping Artwork Showcase (proporções idênticas à versão anterior escaladas para 760x1350)
  // 1st (Top): Circular Top #1 Artist (soft diffuse shadow, no stroke)
  // 2nd (Middle): Rounded Card Top #1 Album (overlaps top of bottom vinyl)
  // 3rd (Bottom): Stylized Vinyl Disc for Top #1 Scrobbles
  const artSize = 296;
  const artX = 433;
  const cardRadius = 17;

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

  // 4c. Bottom Element (y: 939): Stylized Vinyl Disc for Top #1 Scrobbles
  const vinylDiameter = artSize;
  const vinylCx = artX + artSize / 2;
  const vinylCy = 939 + artSize / 2;

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
        blur: 22,
        offsetX: 0,
        offsetY: 8,
      },
    }),
  );

  // 4b. Middle Card (y: 654): Top #1 Album
  const albumCardY = 654;
  elements.push(
    createRectangleElement({
      x: artX,
      y: albumCardY,
      width: artSize,
      height: artSize,
      borderRadius: cardRadius,
      fillStyle: "#121212",
      shadow: {
        color: "rgba(0, 0, 0, 0.42)",
        blur: 20,
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

  // 4a. Top Circle (y: 370): Top #1 Artist (soft diffuse shadow, no stroke)
  const artistCircleY = 370;
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
        color: "rgba(0, 0, 0, 0.36)",
        blur: 18,
        offsetX: 0,
        offsetY: 6,
      },
    }),
  );

  // 5. Left Column: Top 3 Lists (mesmas coordenadas e espaçamentos proporcionais da versão anterior)
  // 1) Top Artists (y: 447)
  // 2) Top Albuns  (y: 706)
  // 3) Top Scrobbles (y: 998)
  const listX = leftMargin; // 59
  const itemTextX = listX + 37; // 96
  const itemMaxWidth = artX - itemTextX - 25; // 312px

  // 5a. Top Artists Section
  const artistsHeaderY = 447;
  elements.push(
    createTextElement({
      text: "Top Artists",
      x: listX,
      y: artistsHeaderY,
      font: '34px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: 348,
      maxLines: 1,
    }),
  );

  for (let i = 0; i < 3; i++) {
    const item = profileData.topArtists[i];
    const rowY = artistsHeaderY + 53 + i * 44;
    const artistName = item?.artist?.name || "—";

    elements.push(
      createTextElement({
        text: String(i + 1),
        x: listX,
        y: rowY,
        font: '22px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.48)",
        align: "left",
        vibrancy: "secondary",
        maxWidth: 28,
        maxLines: 1,
      }),
      createTextElement({
        text: artistName,
        x: itemTextX,
        y: rowY,
        font: '22px "NotoSans-Bold", sans-serif',
        fillStyle: "#ffffff",
        align: "left",
        maxWidth: itemMaxWidth,
        maxLines: 1,
      }),
    );
  }

  // 5b. Top Albuns Section
  const albumsHeaderY = 706;
  elements.push(
    createTextElement({
      text: "Top Albuns",
      x: listX,
      y: albumsHeaderY,
      font: '34px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: 348,
      maxLines: 1,
    }),
  );

  for (let i = 0; i < 3; i++) {
    const item = profileData.topAlbums[i];
    const rowY = albumsHeaderY + 52 + i * 68;
    const albumName = item?.album?.name || "—";
    const artistName = item?.album?.artist || "";

    elements.push(
      createTextElement({
        text: String(i + 1),
        x: listX,
        y: rowY,
        font: '21px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.48)",
        align: "left",
        vibrancy: "secondary",
        maxWidth: 28,
        maxLines: 1,
      }),
      createTextElement({
        text: albumName,
        x: itemTextX,
        y: rowY,
        font: '21px "NotoSans-Bold", sans-serif',
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
          y: rowY + 25,
          font: '18px "NotoSans-Regular", sans-serif',
          fillStyle: "rgba(255, 255, 255, 0.62)",
          align: "left",
          maxWidth: itemMaxWidth,
          maxLines: 1,
        }),
      );
    }
  }

  // 5c. Top Scrobbles Section
  const scrobblesHeaderY = 998;
  elements.push(
    createTextElement({
      text: "Top Scrobbles",
      x: listX,
      y: scrobblesHeaderY,
      font: '34px "NotoSans-Bold", sans-serif',
      fillStyle: "#ffffff",
      align: "left",
      vibrancy: "primary",
      maxWidth: 348,
      maxLines: 1,
    }),
  );

  for (let i = 0; i < 3; i++) {
    const item = profileData.topTracks[i];
    const rowY = scrobblesHeaderY + 52 + i * 68;
    const trackName = item?.track?.name || "—";
    const artistName = item?.track?.artist || "";

    elements.push(
      createTextElement({
        text: String(i + 1),
        x: listX,
        y: rowY,
        font: '21px "NotoSans-Bold", sans-serif',
        fillStyle: "rgba(255, 255, 255, 0.48)",
        align: "left",
        vibrancy: "secondary",
        maxWidth: 28,
        maxLines: 1,
      }),
      createTextElement({
        text: trackName,
        x: itemTextX,
        y: rowY,
        font: '21px "NotoSans-Bold", sans-serif',
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
          y: rowY + 25,
          font: '18px "NotoSans-Regular", sans-serif',
          fillStyle: "rgba(255, 255, 255, 0.62)",
          align: "left",
          maxWidth: itemMaxWidth,
          maxLines: 1,
        }),
      );
    }
  }

  // 6. Footer Watermark: Glass pill with Telegram logo + t.me/<botusername>
  elements.push(
    ...createWatermarkElements({
      canvasWidth: width,
      canvasHeight: height,
      bottomOffset: 27,
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
    type: "lastfm-profile",
    width,
    height,
    background: "#080808",
    format: "jpeg",
    elements,
  };
}

export default profilelfTemplate;
