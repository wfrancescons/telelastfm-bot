import {
  getCachedImageUrl,
  isPlaceholderImageUrl,
  setCachedImageUrl,
} from "@/database/services/imageCache.ts";
import type { LastfmPeriod } from "@/utils/validValuesMap.ts";
import {
  buildImagesFromUrl,
  DEFAULT_IMAGE,
  extractImage,
  getOgImage,
  makeRequest,
} from "./client.ts";
import type {
  AlbumInfoData,
  ArtistInfoData,
  LastfmTag,
  RecentTrackItem,
  TopAlbumItem,
  TopArtistItem,
  TopTrackItem,
  TrackInfoData,
} from "./types.ts";

export * from "./types.ts";

// deno-lint-ignore no-explicit-any
function handleRequestError(error: any): never {
  const status = error?.status ?? error?.response?.status;
  if (status === 403) {
    throw "PRIVATE_USER";
  }
  if (status === 404) {
    throw "USER_CHANGED_USERNAME";
  }
  throw error;
}

// deno-lint-ignore no-explicit-any
function normalizeTags(rawTags: any): LastfmTag[] {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) return rawTags;
  if (typeof rawTags === "object" && "name" in rawTags) return [rawTags];
  return [];
}

export async function getRecentTracks(
  username: string,
  limit = 1,
): Promise<RecentTrackItem[]> {
  try {
    const data = await makeRequest({
      method: "user.getRecentTracks",
      username,
      limit,
    });

    const rawTracks = data.recenttracks?.track;
    const recentTracks = Array.isArray(rawTracks)
      ? rawTracks
      : rawTracks
      ? [rawTracks]
      : null;

    if (!recentTracks) throw "COMMON_ERROR";
    if (recentTracks.length === 0) throw "ZERO_SCROBBLES";

    return recentTracks.map((track) => ({
      track: track.name || "",
      artist: track.artist?.["#text"] || track.artist?.name || "",
      album: track.album?.["#text"] || "",
      image: extractImage(track.image),
      isNowPlaying: Boolean(track["@attr"]?.nowplaying),
      url: track.url || null,
    }));
  } catch (error) {
    handleRequestError(error);
  }
}

export async function getTrackInfo({
  track,
  artist,
  username = null,
}: {
  track: string;
  artist: string;
  username?: string | null;
}): Promise<TrackInfoData> {
  try {
    const params: Record<string, string | number> = {
      method: "track.getInfo",
      track,
      artist,
      autocorrect: 1,
    };

    if (username) params.username = username;

    const response = await makeRequest(params);

    const albumTitle = response.track?.album?.title || "";
    const artistName = response.track?.artist?.name || artist;
    const trackName = response.track?.name || track;
    const trackUrl = response.track?.url || null;

    let image = buildImagesFromUrl(DEFAULT_IMAGE);
    if (response.track?.album?.image?.length) {
      image = extractImage(response.track.album.image);
    }

    if (isPlaceholderImageUrl(image.large)) {
      const cached = await getCachedImageUrl("tracks", {
        track: trackName,
        album: albumTitle,
        artist: artistName,
      });
      if (cached) {
        image = buildImagesFromUrl(cached);
      } else if (trackUrl) {
        const ogUrl = await getOgImage(trackUrl);
        if (!isPlaceholderImageUrl(ogUrl)) {
          image = buildImagesFromUrl(ogUrl);
          await setCachedImageUrl(
            "tracks",
            { track: trackName, album: albumTitle, artist: artistName },
            image.large,
          );
        }
      }
    } else {
      await setCachedImageUrl(
        "tracks",
        { track: trackName, album: albumTitle, artist: artistName },
        image.large,
      );
    }

    return {
      track: trackName,
      album: albumTitle,
      artist: artistName,
      userplaycount: Number(response.track?.userplaycount) || 0,
      lovedtrack: Boolean(Number(response.track?.userloved)),
      tags: normalizeTags(response.track?.toptags?.tag),
      url: trackUrl,
      image,
    };
  } catch (error) {
    handleRequestError(error);
  }
}

export async function getAlbumInfo({
  album,
  artist,
  username = null,
}: {
  album: string;
  artist: string;
  username?: string | null;
}): Promise<AlbumInfoData> {
  try {
    const params: Record<string, string | number> = {
      method: "album.getInfo",
      album,
      artist,
      autocorrect: 1,
    };

    if (username) params.username = username;

    const response = await makeRequest(params);
    if (response.error === 6 || !response.album) {
      throw "CUSTOM_ALBUM_NOT_FOUND";
    }

    const albumName = response.album?.name || album;
    const artistName = response.album?.artist || artist;
    const albumUrl = response.album?.url || null;

    let image = buildImagesFromUrl(DEFAULT_IMAGE);
    if (response.album?.image?.length) {
      image = extractImage(response.album.image);
    }

    if (isPlaceholderImageUrl(image.large)) {
      const cached = await getCachedImageUrl("albums", {
        album: albumName,
        artist: artistName,
      });
      if (cached) {
        image = buildImagesFromUrl(cached);
      } else if (albumUrl) {
        const ogUrl = await getOgImage(albumUrl);
        if (!isPlaceholderImageUrl(ogUrl)) {
          image = buildImagesFromUrl(ogUrl);
          await setCachedImageUrl(
            "albums",
            { album: albumName, artist: artistName },
            image.large,
          );
        }
      }
    } else {
      await setCachedImageUrl(
        "albums",
        { album: albumName, artist: artistName },
        image.large,
      );
    }

    return {
      album: albumName,
      artist: artistName,
      userplaycount: Number(response.album?.userplaycount) || 0,
      tags: normalizeTags(response.album?.tags?.tag),
      url: albumUrl,
      image,
    };
  } catch (error) {
    // deno-lint-ignore no-explicit-any
    if ((error as any)?.status === 404 || error === "CUSTOM_ALBUM_NOT_FOUND") {
      throw "CUSTOM_ALBUM_NOT_FOUND";
    }
    handleRequestError(error);
  }
}

export async function getArtistInfo({
  artist,
  username = null,
}: {
  artist: string;
  username?: string | null;
}): Promise<ArtistInfoData> {
  try {
    const params: Record<string, string | number> = {
      method: "artist.getInfo",
      artist,
      autocorrect: 1,
    };

    if (username) params.username = username;

    const response = await makeRequest(params);
    if (response.error === 6 || !response.artist) {
      throw "CUSTOM_ARTIST_NOT_FOUND";
    }

    const artistName = response.artist?.name || artist;
    const artistUrl =
      response.artist?.url ||
      `https://www.last.fm/music/${encodeURIComponent(artistName)}`;

    let image = response.artist?.image?.length
      ? extractImage(response.artist.image)
      : buildImagesFromUrl(DEFAULT_IMAGE);

    if (isPlaceholderImageUrl(image.large)) {
      const cached = await getCachedImageUrl("artists", { artist: artistName });
      if (cached) {
        image = buildImagesFromUrl(cached);
      } else if (artistUrl) {
        const ogUrl = await getOgImage(artistUrl);
        if (!isPlaceholderImageUrl(ogUrl)) {
          image = buildImagesFromUrl(ogUrl);
          await setCachedImageUrl(
            "artists",
            { artist: artistName },
            image.large,
          );
        }
      }
    } else {
      await setCachedImageUrl("artists", { artist: artistName }, image.large);
    }

    return {
      artist: artistName,
      userplaycount: Number(response.artist?.stats?.userplaycount) || 0,
      tags: normalizeTags(response.artist?.tags?.tag),
      url: artistUrl,
      image,
    };
  } catch (error) {
    if (error === "CUSTOM_ARTIST_NOT_FOUND") {
      throw "CUSTOM_ARTIST_NOT_FOUND";
    }
    handleRequestError(error);
  }
}

export async function getTrackListeningNow(
  username: string,
): Promise<TrackInfoData> {
  const recentTracks = await getRecentTracks(username, 1);
  const recent = recentTracks[0];
  const trackInfo = await getTrackInfo({
    track: recent.track,
    artist: recent.artist,
    username,
  });

  const finalImage = !isPlaceholderImageUrl(recent.image.large)
    ? recent.image
    : trackInfo.image;

  if (!isPlaceholderImageUrl(finalImage.large)) {
    await setCachedImageUrl(
      "tracks",
      {
        track: recent.track,
        album: recent.album || trackInfo.album,
        artist: recent.artist,
      },
      finalImage.large,
    );
  }

  return {
    ...recent,
    album: recent.album || trackInfo.album,
    image: finalImage,
    userplaycount: trackInfo.userplaycount,
    lovedtrack: trackInfo.lovedtrack,
    tags: trackInfo.tags,
    url: trackInfo.url ?? recent.url ?? null,
  };
}

export async function getAlbumListeningNow(
  username: string,
): Promise<AlbumInfoData> {
  const recentTracks = await getRecentTracks(username, 1);
  const recent = recentTracks[0];
  const albumInfo = await getAlbumInfo({
    album: recent.album,
    artist: recent.artist,
    username,
  });

  const finalImage = !isPlaceholderImageUrl(albumInfo.image.large)
    ? albumInfo.image
    : recent.image;

  return {
    ...recent,
    album: albumInfo.album || recent.album,
    artist: albumInfo.artist || recent.artist,
    image: finalImage,
    userplaycount: albumInfo.userplaycount || 0,
    tags: albumInfo.tags,
    url: albumInfo.url ?? recent.url ?? null,
  };
}

export async function getArtistListeningNow(
  username: string,
): Promise<ArtistInfoData> {
  const recentTracks = await getRecentTracks(username, 1);
  const recent = recentTracks[0];
  const artistInfo = await getArtistInfo({
    artist: recent.artist,
    username,
  });

  const finalImage = !isPlaceholderImageUrl(artistInfo.image.large)
    ? artistInfo.image
    : recent.image;

  return {
    ...recent,
    artist: artistInfo.artist || recent.artist,
    image: finalImage,
    userplaycount: artistInfo.userplaycount || 0,
    tags: artistInfo.tags,
    url: artistInfo.url ?? recent.url ?? null,
  };
}

export async function resolveTrackImageUrl({
  track,
  artist,
  username,
  initialImageUrl,
  trackUrl,
}: {
  track: string;
  artist: string;
  username?: string;
  initialImageUrl?: string;
  trackUrl?: string;
}): Promise<string> {
  if (initialImageUrl && !isPlaceholderImageUrl(initialImageUrl)) {
    await setCachedImageUrl("tracks", { track, artist }, initialImageUrl);
    return initialImageUrl;
  }

  const cached = await getCachedImageUrl("tracks", { track, artist });
  if (cached) return cached;

  try {
    const info = await getTrackInfo({ track, artist, username });
    if (info.image?.large && !isPlaceholderImageUrl(info.image.large)) {
      await setCachedImageUrl("tracks", { track, artist }, info.image.large);
      return info.image.large;
    }
  } catch {
    // Fallback to trackUrl og:image if getTrackInfo fails
  }

  if (trackUrl) {
    const og = await getOgImage(trackUrl);
    const large = buildImagesFromUrl(og).large;
    if (!isPlaceholderImageUrl(large)) {
      await setCachedImageUrl("tracks", { track, artist }, large);
      return large;
    }
  }

  return DEFAULT_IMAGE;
}

export async function resolveAlbumImageUrl({
  album,
  artist,
  initialImageUrl,
  albumUrl,
}: {
  album: string;
  artist: string;
  initialImageUrl?: string;
  albumUrl?: string;
}): Promise<string> {
  if (initialImageUrl && !isPlaceholderImageUrl(initialImageUrl)) {
    await setCachedImageUrl("albums", { album, artist }, initialImageUrl);
    return initialImageUrl;
  }

  const cached = await getCachedImageUrl("albums", { album, artist });
  if (cached) return cached;

  if (albumUrl) {
    const og = await getOgImage(albumUrl);
    const large = buildImagesFromUrl(og).large;
    if (!isPlaceholderImageUrl(large)) {
      await setCachedImageUrl("albums", { album, artist }, large);
      return large;
    }
  }

  return initialImageUrl || DEFAULT_IMAGE;
}

export async function resolveArtistImageUrl({
  artist,
  artistUrl,
}: {
  artist: string;
  artistUrl?: string;
}): Promise<string> {
  const cached = await getCachedImageUrl("artists", { artist });
  if (cached) return cached;

  const targetUrl =
    artistUrl || `https://www.last.fm/music/${encodeURIComponent(artist)}`;
  const og = await getOgImage(targetUrl);
  const large = buildImagesFromUrl(og).large;

  if (!isPlaceholderImageUrl(large)) {
    await setCachedImageUrl("artists", { artist }, large);
    return large;
  }

  return DEFAULT_IMAGE;
}

export async function getUserTopTracks(
  username: string,
  period: LastfmPeriod,
  limit = 5,
): Promise<TopTrackItem[]> {
  try {
    const data = await makeRequest({
      method: "user.getTopTracks",
      username,
      period,
      limit,
    });

    const tracks = data.toptracks?.track;
    if (!Array.isArray(tracks) || tracks.length === 0) {
      throw "ZERO_SCROBBLES";
    }

    return await Promise.all(
      tracks.map(async (item) => {
        const trackName = item.name || "";
        const artistName = item.artist?.name || "";
        const extracted = extractImage(item.image);
        const image = await resolveTrackImageUrl({
          track: trackName,
          artist: artistName,
          username,
          initialImageUrl: extracted.large,
          trackUrl: item.url,
        });

        return {
          rank: item["@attr"]?.rank ?? 0,
          image,
          track: {
            name: trackName,
            artist: artistName,
          },
          scrobbles: Number(item.playcount) || 0,
        };
      }),
    );
  } catch (error) {
    handleRequestError(error);
  }
}

export async function getUserTopAlbums(
  username: string,
  period: LastfmPeriod,
  limit = 5,
): Promise<TopAlbumItem[]> {
  try {
    const data = await makeRequest({
      method: "user.getTopAlbums",
      username,
      period,
      limit,
    });

    const albums = data.topalbums?.album;
    if (!Array.isArray(albums) || albums.length === 0) {
      throw "ZERO_SCROBBLES";
    }

    return await Promise.all(
      albums.map(async (item) => {
        const albumName = item.name || "";
        const artistName = item.artist?.name || "";
        const extracted = extractImage(item.image);
        const image = await resolveAlbumImageUrl({
          album: albumName,
          artist: artistName,
          initialImageUrl: extracted.large,
          albumUrl: item.url,
        });

        return {
          rank: item["@attr"]?.rank ?? 0,
          image,
          album: {
            name: albumName,
            artist: artistName,
          },
          scrobbles: Number(item.playcount) || 0,
        };
      }),
    );
  } catch (error) {
    handleRequestError(error);
  }
}

export async function getUserTopArtists(
  username: string,
  period: LastfmPeriod,
  limit = 5,
): Promise<TopArtistItem[]> {
  try {
    const data = await makeRequest({
      method: "user.getTopArtists",
      username,
      period,
      limit,
    });

    const artists = data.topartists?.artist;
    if (!Array.isArray(artists) || artists.length === 0) {
      throw "ZERO_SCROBBLES";
    }

    return await Promise.all(
      artists.map(async (item) => {
        const artistName = item.name || "";
        const image = await resolveArtistImageUrl({
          artist: artistName,
          artistUrl: item.url,
        });

        return {
          rank: item["@attr"]?.rank ?? 0,
          image,
          artist: {
            name: artistName,
          },
          scrobbles: Number(item.playcount) || 0,
        };
      }),
    );
  } catch (error) {
    handleRequestError(error);
  }
}

export async function getLastfmUserData(username: string) {
  try {
    return await makeRequest({
      method: "user.getInfo",
      user: username,
    });
  } catch (error) {
    // deno-lint-ignore no-explicit-any
    if ((error as any)?.status === 404) {
      throw "NOT_A_VALID_LASTFM_USER";
    }
    throw error;
  }
}

export async function getWeeklyTrackChart(username: string) {
  try {
    return await makeRequest({
      method: "user.getweeklytrackchart",
      user: username,
    });
  } catch (error) {
    handleRequestError(error);
  }
}

