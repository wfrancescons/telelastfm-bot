export type MediaType = "tracks" | "albums" | "artists";
export type LastfmPeriod =
  | "overall"
  | "7day"
  | "1month"
  | "3month"
  | "6month"
  | "12month";

export const acceptedMedias = [
  "tracks",
  "track",
  "tra",
  "lf",
  "music",
  "musics",
  "musica",
  "musicas",
  "música",
  "músicas",
  "faixa",
  "faixas",
  "albums",
  "album",
  "alb",
  "artists",
  "artist",
  "art",
  "artista",
  "artistas",
] as const;

export const mediaMap: Record<string, MediaType> = {
  // Tracks aliases
  tracks: "tracks",
  track: "tracks",
  tra: "tracks",
  lf: "tracks",
  music: "tracks",
  musics: "tracks",
  musica: "tracks",
  musicas: "tracks",
  "música": "tracks",
  "músicas": "tracks",
  faixa: "tracks",
  faixas: "tracks",

  // Albums aliases
  albums: "albums",
  album: "albums",
  alb: "albums",

  // Artists aliases
  artists: "artists",
  artist: "artists",
  art: "artists",
  artista: "artists",
  artistas: "artists",
};

export type CollageParam = "notexts" | "notitles" | "noplays";

export const CLEAN_PARAM_ALIASES = [
  "notexts",
  "notext",
  "clean",
  "nonames",
  "nooverlay",
  "notexto",
  "notextos",
  "semtexto",
  "semtextos",
] as const;

export const NO_TITLES_PARAM_ALIASES = [
  "notitles",
  "notitle",
  "notitulo",
  "notitulos",
  "semtitulo",
  "semtitulos",
  "minimal"
] as const;

export const NO_PLAYS_PARAM_ALIASES = [
  "noplays",
  "noscrobbles",
  "noplay",
  "noscrobble",
  "semscrobble",
  "semscrobbles",
] as const;

export const acceptedCollageParams = [
  ...CLEAN_PARAM_ALIASES,
  ...NO_TITLES_PARAM_ALIASES,
  ...NO_PLAYS_PARAM_ALIASES,
] as const;

export const collageParamMap: Record<string, CollageParam> = {
  // Clean / No texts
  notexts: "notexts",
  notext: "notexts",
  clean: "notexts",
  nonames: "notexts",
  nooverlay: "notexts",
  notexto: "notexts",
  notextos: "notexts",
  semtexto: "notexts",
  semtextos: "notexts",

  // No titles
  notitles: "notitles",
  notitle: "notitles",
  notitulo: "notitles",
  notitulos: "notitles",
  semtitulo: "notitles",
  semtitulos: "notitles",

  // No plays / No scrobbles
  noplays: "noplays",
  noscrobbles: "noplays",
  noplay: "noplays",
  noscrobble: "noplays",
  semscrobble: "noplays",
  semscrobbles: "noplays",
};

export const acceptedHdParams = [
  "hd",
  "hq",
  "doc",
  "document",
  "documento",
  "file",
  "arquivo",
] as const;

export function hasHdParam(rawText: string): boolean {
  const tokens = rawText.trim().toLowerCase().split(/\s+/).slice(1);
  return tokens.some((token) =>
    (acceptedHdParams as readonly string[]).includes(token),
  );
}

export const acceptedPeriods = [
  "overall",
  "all",
  "7day",
  "7d",
  "7days",
  "1w",
  "1month",
  "1m",
  "30d",
  "3month",
  "3m",
  "3months",
  "6month",
  "6m",
  "6months",
  "12month",
  "12m",
  "1y",
  "1year",
] as const;

export const periodMap: Record<string, LastfmPeriod> = {
  overall: "overall",
  all: "overall",
  "7day": "7day",
  "7d": "7day",
  "7days": "7day",
  "1w": "7day",
  "1month": "1month",
  "1m": "1month",
  "30d": "1month",
  "3month": "3month",
  "3m": "3month",
  "3months": "3month",
  "6month": "6month",
  "6m": "6month",
  "6months": "6month",
  "12month": "12month",
  "12m": "12month",
  "1y": "12month",
  "1year": "12month",
};

export const periodInTextMap: Record<LastfmPeriod, string> = {
  overall: "all time",
  "7day": "last 7 days",
  "1month": "last month",
  "3month": "last 3 months",
  "6month": "last 6 months",
  "12month": "last 12 months",
};

