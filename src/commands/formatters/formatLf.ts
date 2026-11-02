import type { LastfmImages, LastfmTag } from "@/services/lastfm/index.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export type FormatLfParams = {
  first_name: string;
  track: string;
  album: string;
  artist: string;
  userplaycount: number;
  lovedtrack?: boolean;
  isLovedTrack?: boolean;
  isNowPlaying?: boolean;
  isCustom?: boolean;
  tags?: LastfmTag[];
  image: LastfmImages;
};

function formatTagList(tags?: LastfmTag[]): string | null {
  if (!tags || tags.length === 0) return null;
  const formatted = tags
    .slice(0, 3)
    .map((tag) => tag.name.trim().toLowerCase().replace(/\s+/g, ""))
    .filter(Boolean)
    .join(", ");
  return formatted || null;
}

export default function formatLf(data: FormatLfParams) {
  const statusText = data.isCustom
    ? "listened"
    : data.isNowPlaying
    ? "is now listening"
    : "was listening";
  const isLoved = Boolean(data.lovedtrack ?? data.isLovedTrack);
  const loveText = isLoved ? " loves ❤️ and" : "";
  const playcount = data.isNowPlaying
    ? (Number(data.userplaycount) || 0) + 1
    : Number(data.userplaycount) || 0;
  const scrobbles = `${playcount.toLocaleString("pt-BR")} ${
    playcount !== 1 ? "scrobbles so far" : "scrobble so far"
  }`;

  const formattedTags = formatTagList(data.tags);

  let msg = FormattedString.bold(data.first_name || "User")
    .plain(`${loveText} ${statusText} to:\n🎶 `)
    .bold(data.track || "Unknown Track")
    .plain(`\n💿 ${data.album || ""}\n🧑‍🎤 ${data.artist || ""}`);

  if (formattedTags) {
    msg = msg.plain("\n🏷️ ").italic(formattedTags);
  }

  msg = msg.plain(`\n\n📈 ${scrobbles}`);

  return {
    text: msg.text,
    entities: msg.entities,
    link_preview_options: {
      prefer_large_media: true,
      url: data.image.large,
    },
  };
}

