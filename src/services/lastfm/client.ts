import { DOMParser } from "@b-fuze/deno-dom";
import Bottleneck from "bottleneck";
import config from "@/config.ts";
import type { LastfmImages } from "./types.ts";

const LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/";
export const DEFAULT_IMAGE =
  "https://lastfm.freetls.fastly.net/i/u/500x500/2a96cbd8b46e442fc41c2b86b821562f.png";

const REQUEST_TIMEOUT_MS = 5000;

const apiLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 120,
});

const scrapingLimiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 180,
});

const HTTP_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

function parseRetryAfterMs(headerValue: string | null, attempt: number): number {
  if (headerValue) {
    const seconds = Number(headerValue);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 15000);
    }
    const dateMs = Date.parse(headerValue);
    if (!Number.isNaN(dateMs)) {
      const diff = dateMs - Date.now();
      if (diff > 0) return Math.min(diff, 15000);
    }
  }
  const baseBackoff = 1200 * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 450);
  return Math.min(baseBackoff + jitter, 12000);
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  timeout = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 429) {
        if (attempt < retries) {
          const waitMs = parseRetryAfterMs(
            response.headers.get("retry-after"),
            attempt,
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        return response;
      }

      if (response.status >= 500 && response.status < 600) {
        throw new Error(`Server Error: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      if (attempt < retries) {
        const backoffMs =
          1000 * Math.pow(1.8, attempt - 1) + Math.floor(Math.random() * 350);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
}

function buildApiUrl(params: Record<string, string | number>): string {
  const url = new URL(LASTFM_API_URL);
  const searchParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    searchParams.set(k, String(v));
  }
  searchParams.set("api_key", config.lastfm_token);
  searchParams.set("format", "json");
  url.search = searchParams.toString();
  return url.toString();
}

export const makeRequest = apiLimiter.wrap(
  async (
    params: Record<string, string | number>,
  // deno-lint-ignore no-explicit-any
  ): Promise<Record<string, any>> => {
    const url = buildApiUrl(params);
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      const err = new Error(`Last.fm HTTP ${response.status}`) as Error & {
        status?: number;
        response?: { status: number };
      };
      err.status = response.status;
      err.response = { status: response.status };
      throw err;
    }

    const text = await response.text();
    return JSON.parse(text);
  },
);

export function buildImagesFromUrl(rawUrl?: string | null): LastfmImages {
  const base = rawUrl && rawUrl.trim()
    ? rawUrl
      .trim()
      .replace("lastfm-img.freetls.fastly.net", "lastfm.freetls.fastly.net")
    : DEFAULT_IMAGE;
  const cropRegex = /\/(?:\d+x\d+|\d+s|ar0)\//;

  if (!cropRegex.test(base)) {
    return {
      small: base,
      medium: base,
      large: base,
      extralarge: base,
    };
  }

  return {
    small: base.replace(cropRegex, "/34s/"),
    medium: base.replace(cropRegex, "/300x300/"),
    large: base.replace(cropRegex, "/500x500/"),
    extralarge: base.replace(cropRegex, "/770x0/"),
  };
}

export function extractImage(
  images?: Array<{ "#text"?: string; size?: string }>,
): LastfmImages {
  if (!Array.isArray(images) || images.length === 0) {
    return buildImagesFromUrl(DEFAULT_IMAGE);
  }

  const last = images[images.length - 1];
  const raw = last?.["#text"] || DEFAULT_IMAGE;
  return buildImagesFromUrl(raw);
}

export const getOgImage = scrapingLimiter.wrap(
  async (url: string): Promise<string> => {
    try {
      const response = await fetchWithRetry(
        url,
        { headers: HTTP_HEADERS },
        2,
        5000,
      );
      if (!response.ok) return DEFAULT_IMAGE;

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const ogImage = doc
        ?.querySelector('meta[property="og:image"]')
        ?.getAttribute("content");

      if (!ogImage) return DEFAULT_IMAGE;

      return ogImage.replace(/\/ar0\//, "/500x500/").replace("ar0", "500x500");
    } catch (error) {
      console.error("Last.fm og:image scrape error:", error);
      return DEFAULT_IMAGE;
    }
  },
);

