import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calendarlfTemplate } from "@/commands/templates/calendarlfTemplate.ts";
import { parseCalendarArgs } from "@/commands/handleCalendarlf.ts";
import { parseTopArgs } from "@/commands/handleToplf.ts";
import { toplfTemplate } from "@/commands/templates/toplfTemplate.ts";
import { vinyllfTemplate } from "@/commands/templates/vinyllfTemplate.ts";
import { gridlfTemplate } from "@/commands/templates/gridlfTemplate.ts";
import type { TopAlbumItem } from "@/services/lastfm/types.ts";

describe("Templates Generation", () => {
  describe("calendarlfTemplate", () => {
    it("should build calendar template with 1080x1350 dimensions and elements", () => {
      const template = calendarlfTemplate({
        year: 2026,
        monthIndex: 7, // August
        media_type: "albums",
        daysData: new Map(),
        param: "clean",
      });

      assert.equal(template.width, 1080);
      assert.equal(template.height, 1350);
      assert.equal(template.type, "lastfm-calendar");
      assert.equal(template.elements.length > 0, true);

      // Verify header subtitle pill
      const headerPill = template.elements.find(
        (el) => el.type === "rectangle" && el.style?.type === "glass",
      );
      assert.notEqual(headerPill, undefined);

      // Verify month text element
      const monthEl = template.elements.find(
        (el) => el.type === "text" && el.text === "august",
      );
      assert.notEqual(monthEl, undefined);
    });

    it("should parse calendar args correctly when hd is present", () => {
      const parsed = parseCalendarArgs("/calendarlf hd");
      assert.equal(parsed.media_type, "albums");
      assert.equal(parsed.param, null);

      const parsedWithMedia = parseCalendarArgs("/calendarlf tracks hd");
      assert.equal(parsedWithMedia.media_type, "tracks");
      assert.equal(parsedWithMedia.param, null);
    });
  });

  describe("vinyllfTemplate", () => {
    it("should build vinyl template in 1080x1080 with header and vinyl disc", () => {
      const template = vinyllfTemplate({
        lastfm_data: {
          track: "Song Title",
          album: "Album Title",
          artist: "Artist Name",
          userplaycount: 42,
          image: "https://example.com/cover.jpg",
          isNowPlaying: true,
        },
        media_type: "tracks",
      });

      assert.equal(template.width, 1080);
      assert.equal(template.height, 1080);
      assert.equal(template.type, "lastfm-vinyl");

      // Verify header status is "listening to:" when isNowPlaying is true
      const headerStatus = template.elements.find(
        (el) => el.type === "text" && el.text === "listening to:",
      );
      assert.notEqual(headerStatus, undefined);

      // Verify vinyl disc element exists
      const vinylDisc = template.elements.find((el) => el.type === "vinylDisc");
      assert.notEqual(vinylDisc, undefined);
    });

    it("should set header status to 'listened to:' when isNowPlaying is false", () => {
      const template = vinyllfTemplate({
        lastfm_data: {
          artist: "Artist Name",
          userplaycount: 10,
          image: "https://example.com/cover.jpg",
          isNowPlaying: false,
        },
        media_type: "artists",
      });

      const headerStatus = template.elements.find(
        (el) => el.type === "text" && el.text === "listened to:",
      );
      assert.notEqual(headerStatus, undefined);
    });
  });

  describe("gridlfTemplate", () => {
    it("should build grid template for 3x3 posters with adaptive sizing", () => {
      const sampleItems: TopAlbumItem[] = Array.from({ length: 9 }, (_, i) => ({
        album: { name: `Album ${i + 1}`, artist: `Artist ${i + 1}` },
        image: "https://example.com/img.jpg",
        scrobbles: 10 + i,
        rank: i + 1,
      }));

      const template = gridlfTemplate({
        lastfm_data: sampleItems,
        columns: 3,
        rows: 3,
        media_type: "albums",
      });

      // 1800 / 3 = 600, clamped to max 420px -> 3 * 420 = 1260px
      assert.equal(template.width, 3 * 420);
      assert.equal(template.height, 3 * 420);
      assert.equal(template.type, "lastfm-grid");
      assert.equal(template.elements.length > 0, true);
    });
  });

  describe("toplfTemplate", () => {
    it("should build 760x1350 top template with headline, top lists, and right artwork", () => {
      const template = toplfTemplate({
        profileData: {
          username: "usuariolastfm",
          realname: null,
          avatar: "https://lastfm.freetls.fastly.net/i/u/300x300/abc12345.gif",
          scrobbles: 196689,
          artistsCount: 4032,
          lovedTracksCount: 431,
          topArtists: [
            { rank: 1, artist: { name: "Drake" }, scrobbles: 5000, image: "https://example.com/a1.jpg" },
            { rank: 2, artist: { name: "Mac Miller" }, scrobbles: 4000, image: "https://example.com/a2.jpg" },
            { rank: 3, artist: { name: "Kid Cudi" }, scrobbles: 3000, image: "https://example.com/a3.jpg" },
          ],
          topTracks: [
            { rank: 1, track: { name: "Someone Like You", artist: "Mac Miller" }, scrobbles: 300, image: "https://example.com/t1.jpg" },
          ],
          topAlbums: [
            { rank: 1, album: { name: "Melt", artist: "Not for Radio" }, scrobbles: 800, image: "https://example.com/alb1.jpg" },
          ],
        },
        period: "7day",
      });

      assert.equal(template.width, 760);
      assert.equal(template.height, 1350);
      assert.equal(template.type, "lastfm-top");

      // Should render pill and period headline
      const pillEl = template.elements.find(
        (el) => el.type === "text" && el.text === "top scrobbles of",
      );
      assert.notEqual(pillEl, undefined);

      const headlineEl = template.elements.find(
        (el) => el.type === "text" && el.text === "last 7 days",
      );
      assert.notEqual(headlineEl, undefined);

      // Should parse top args with default 7day and custom period
      const defaultParsed = parseTopArgs("/toplf");
      assert.equal(defaultParsed.period, "7day");
      assert.equal(defaultParsed.isHd, false);

      const parsedWithArgs = parseTopArgs("/toplf 1m hd");
      assert.equal(parsedWithArgs.period, "1month");
      assert.equal(parsedWithArgs.isHd, true);
    });
  });
});
