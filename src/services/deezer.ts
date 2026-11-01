import Bottleneck from "bottleneck";

const deezerLimiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 120,
});

const DEEZER_TIMEOUT_MS = 3000;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\$/g, "s")
    .replace(/!/g, "i")
    .replace(/@/g, "a")
    .replace(/&/g, "and")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches an artist image from Deezer's public search API.
 * Returns picture_big (500x500 square JPEG) if the artist matches, or null otherwise.
 */
export const fetchDeezerArtistImage = deezerLimiter.wrap(
  async (artistName: string): Promise<string | null> => {
    if (!artistName || !artistName.trim()) return null;
    const trimmed = artistName.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEEZER_TIMEOUT_MS);

    try {
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(trimmed)}&limit=5`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) return null;
      const data = await response.json();
      const candidates = Array.isArray(data?.data) ? data.data : [];
      if (candidates.length === 0) return null;

      const targetNorm = normalizeName(trimmed);

      // 1. Try exact name match first
      // deno-lint-ignore no-explicit-any
      let best = candidates.find(
        (c: any) => normalizeName(c.name || "") === targetNorm,
      );

      // 2. If no exact match, look for whole-word / prefix / suffix matches and pick the most popular
      if (!best) {
        // deno-lint-ignore no-explicit-any
        const matches = candidates.filter((c: any) => {
          const matchNorm = normalizeName(c.name || "");
          return (
            matchNorm === targetNorm ||
            matchNorm.startsWith(`${targetNorm} `) ||
            matchNorm.endsWith(` ${targetNorm}`) ||
            matchNorm.includes(` ${targetNorm} `)
          );
        });
        if (matches.length > 0) {
          // deno-lint-ignore no-explicit-any
          matches.sort((a: any, b: any) => (b.nb_fan || 0) - (a.nb_fan || 0));
          best = matches[0];
        }
      }

      if (!best) return null;

      // Deezer picture_big is standard 500x500 square JPEG
      const picture = best.picture_big || best.picture_xl;
      if (!picture || typeof picture !== "string") return null;
      if (picture.includes("/artist//") || picture.includes("placeholder")) {
        return null;
      }

      return picture;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  },
);

export default fetchDeezerArtistImage;

