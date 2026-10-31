import {
  getCachedImageUrl,
  isPlaceholderImageUrl,
  setCachedImageUrl,
} from "@/database/services/imageCache.ts";
import type { LastfmPeriod, MediaType } from "@/utils/validValuesMap.ts";
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
  CalendarDayItem,
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

const pendingImageResolutions = new Map<string, Promise<string>>();

function deduplicateResolution(
  cacheKey: string,
  resolver: () => Promise<string>,
): Promise<string> {
  const existing = pendingImageResolutions.get(cacheKey);
  if (existing) return existing;

  const promise = resolver().finally(() => {
    pendingImageResolutions.delete(cacheKey);
  });
  pendingImageResolutions.set(cacheKey, promise);
  return promise;
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
  const canonicalInitial = initialImageUrl
    ? buildImagesFromUrl(initialImageUrl).large
    : undefined;

  if (canonicalInitial && !isPlaceholderImageUrl(canonicalInitial)) {
    await setCachedImageUrl("tracks", { track, artist }, canonicalInitial);
    return canonicalInitial;
  }

  const cached = await getCachedImageUrl("tracks", { track, artist });
  if (cached) return buildImagesFromUrl(cached).large;

  const dedupKey = `track:${artist.toLowerCase()}|||${track.toLowerCase()}`;
  return deduplicateResolution(dedupKey, async () => {
    try {
      const info = await getTrackInfo({ track, artist, username });
      if (info.image?.large && !isPlaceholderImageUrl(info.image.large)) {
        const canonical = buildImagesFromUrl(info.image.large).large;
        await setCachedImageUrl("tracks", { track, artist }, canonical);
        return canonical;
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
  });
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
  const canonicalInitial = initialImageUrl
    ? buildImagesFromUrl(initialImageUrl).large
    : undefined;

  if (canonicalInitial && !isPlaceholderImageUrl(canonicalInitial)) {
    await setCachedImageUrl("albums", { album, artist }, canonicalInitial);
    return canonicalInitial;
  }

  const cached = await getCachedImageUrl("albums", { album, artist });
  if (cached) return buildImagesFromUrl(cached).large;

  const dedupKey = `album:${artist.toLowerCase()}|||${album.toLowerCase()}`;
  return deduplicateResolution(dedupKey, async () => {
    try {
      const info = await getAlbumInfo({ album, artist });
      if (info.image?.large && !isPlaceholderImageUrl(info.image.large)) {
        const canonical = buildImagesFromUrl(info.image.large).large;
        await setCachedImageUrl("albums", { album, artist }, canonical);
        return canonical;
      }
    } catch {
      // Fallback to albumUrl og:image if getAlbumInfo fails
    }

    if (albumUrl) {
      const og = await getOgImage(albumUrl);
      const large = buildImagesFromUrl(og).large;
      if (!isPlaceholderImageUrl(large)) {
        await setCachedImageUrl("albums", { album, artist }, large);
        return large;
      }
    }

    return canonicalInitial || DEFAULT_IMAGE;
  });
}

export async function resolveArtistImageUrl({
  artist,
  artistUrl,
}: {
  artist: string;
  artistUrl?: string;
}): Promise<string> {
  const cached = await getCachedImageUrl("artists", { artist });
  if (cached) return buildImagesFromUrl(cached).large;

  const dedupKey = `artist:${artist.toLowerCase()}`;
  return deduplicateResolution(dedupKey, async () => {
    const targetUrl =
      artistUrl || `https://www.last.fm/music/${encodeURIComponent(artist)}`;
    const og = await getOgImage(targetUrl);
    const large = buildImagesFromUrl(og).large;

    if (!isPlaceholderImageUrl(large)) {
      await setCachedImageUrl("artists", { artist }, large);
      return large;
    }

    return DEFAULT_IMAGE;
  });
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

const MAX_MONTHLY_PAGES = 30;

export async function getUserMonthlyCalendarData(
  username: string,
  year: number,
  monthIndex: number,
  mediaType: MediaType,
): Promise<Map<number, CalendarDayItem>> {
  try {
    const from = Math.floor(
      new Date(year, monthIndex, 1, 0, 0, 0, 0).getTime() / 1000,
    );
    const to = Math.floor(
      new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime() / 1000,
    );

    const firstPage = await makeRequest({
      method: "user.getRecentTracks",
      username,
      from,
      to,
      limit: 200,
      page: 1,
    });

    const rawFirstTracks = firstPage.recenttracks?.track;
    const firstTracks = Array.isArray(rawFirstTracks)
      ? rawFirstTracks
      : rawFirstTracks
      ? [rawFirstTracks]
      : [];

    if (firstTracks.length === 0) {
      throw "ZERO_SCROBBLES";
    }

    const totalPages = Math.min(
      Number(firstPage.recenttracks?.["@attr"]?.totalPages) || 1,
      MAX_MONTHLY_PAGES,
    );

    // deno-lint-ignore no-explicit-any
    const allTracks: any[] = [...firstTracks];

    if (totalPages > 1) {
      const pageNumbers = Array.from(
        { length: totalPages - 1 },
        (_, idx) => idx + 2,
      );
      const remainingPages = await Promise.all(
        pageNumbers.map(async (page) => {
          try {
            const pageData = await makeRequest({
              method: "user.getRecentTracks",
              username,
              from,
              to,
              limit: 200,
              page,
            });
            const raw = pageData.recenttracks?.track;
            return Array.isArray(raw) ? raw : raw ? [raw] : [];
          } catch {
            return [];
          }
        }),
      );

      for (const pageTracks of remainingPages) {
        allTracks.push(...pageTracks);
      }
    }

    type BucketItem = {
      key: string;
      title: string;
      subtitle?: string;
      trackName: string;
      albumName: string;
      artistName: string;
      count: number;
      initialImageUrl?: string;
      trackUrl?: string;
    };

    const dayBuckets = new Map<number, Map<string, BucketItem>>();

    for (const rawTrack of allTracks) {
      const uts = Number(rawTrack?.date?.uts);
      if (!uts || Number.isNaN(uts)) continue;
      if (uts < from || uts > to) continue;

      const dateObj = new Date(uts * 1000);
      if (
        dateObj.getFullYear() !== year ||
        dateObj.getMonth() !== monthIndex
      ) {
        continue;
      }

      const day = dateObj.getDate();
      const trackName = String(rawTrack.name || "").trim();
      const artistName = String(
        rawTrack.artist?.["#text"] || rawTrack.artist?.name || "",
      ).trim();
      const albumName = String(rawTrack.album?.["#text"] || "").trim();

      if (!artistName) continue;

      let key = "";
      let title = "";
      let subtitle: string | undefined;

      if (mediaType === "tracks") {
        if (!trackName) continue;
        key = `${trackName.toLowerCase()}|||${artistName.toLowerCase()}`;
        title = trackName;
        subtitle = artistName;
      } else if (mediaType === "albums") {
        const effectiveAlbum = albumName || trackName;
        if (!effectiveAlbum) continue;
        key = `${effectiveAlbum.toLowerCase()}|||${artistName.toLowerCase()}`;
        title = effectiveAlbum;
        subtitle = artistName;
      } else {
        key = artistName.toLowerCase();
        title = artistName;
      }

      const extractedImg = extractImage(rawTrack.image).large;
      const validImg = !isPlaceholderImageUrl(extractedImg)
        ? extractedImg
        : undefined;

      let bucket = dayBuckets.get(day);
      if (!bucket) {
        bucket = new Map();
        dayBuckets.set(day, bucket);
      }

      const existing = bucket.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.initialImageUrl && validImg) {
          existing.initialImageUrl = validImg;
        }
      } else {
        bucket.set(key, {
          key,
          title,
          subtitle,
          trackName,
          albumName: albumName || trackName,
          artistName,
          count: 1,
          initialImageUrl: validImg,
          trackUrl: rawTrack.url || undefined,
        });
      }
    }

    if (dayBuckets.size === 0) {
      throw "ZERO_SCROBBLES";
    }

    const winningByDay = new Map<number, BucketItem>();
    const uniqueWinners = new Map<string, BucketItem>();

    for (const [day, bucket] of dayBuckets.entries()) {
      let best: BucketItem | null = null;
      for (const candidate of bucket.values()) {
        if (!best || candidate.count > best.count) {
          best = candidate;
        }
      }
      if (best) {
        winningByDay.set(day, best);
        const prev = uniqueWinners.get(best.key);
        if (!prev || (!prev.initialImageUrl && best.initialImageUrl)) {
          uniqueWinners.set(best.key, best);
        }
      }
    }

    const resolvedImages = new Map<string, string>();
    await Promise.all(
      [...uniqueWinners.values()].map(async (winner) => {
        let imageUrl = DEFAULT_IMAGE;
        if (mediaType === "tracks") {
          imageUrl = await resolveTrackImageUrl({
            track: winner.trackName,
            artist: winner.artistName,
            username,
            initialImageUrl: winner.initialImageUrl,
            trackUrl: winner.trackUrl,
          });
        } else if (mediaType === "albums") {
          imageUrl = await resolveAlbumImageUrl({
            album: winner.albumName,
            artist: winner.artistName,
            initialImageUrl: winner.initialImageUrl,
          });
        } else {
          imageUrl = await resolveArtistImageUrl({
            artist: winner.artistName,
          });
        }
        resolvedImages.set(winner.key, imageUrl);
      }),
    );

    const calendarMap = new Map<number, CalendarDayItem>();
    for (const [day, winner] of winningByDay.entries()) {
      calendarMap.set(day, {
        day,
        title: winner.title,
        subtitle: winner.subtitle,
        scrobbles: winner.count,
        image: resolvedImages.get(winner.key) || DEFAULT_IMAGE,
      });
    }

    return calendarMap;
  } catch (error) {
    handleRequestError(error);
  }
}


