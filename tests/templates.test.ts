import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calendarlfTemplate } from "@/commands/templates/calendarlfTemplate.ts";
import { vinyllfTemplate } from "@/commands/templates/vinyllfTemplate.ts";
import { gridlfTemplate } from "@/commands/templates/gridlfTemplate.ts";

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
    it("should build grid template for 3x3 posters", () => {
      const sampleItems = Array.from({ length: 9 }, (_, i) => ({
        album: { name: `Album ${i + 1}`, artist: `Artist ${i + 1}` },
        image: "https://example.com/img.jpg",
        scrobbles: 10 + i,
        rank: i + 1,
      }));

      const template = gridlfTemplate({
        lastfm_data: sampleItems as any,
        columns: 3,
        rows: 3,
        media_type: "albums",
      });

      assert.equal(template.width, 3 * 250); // 750px
      assert.equal(template.height, 3 * 250); // 750px
      assert.equal(template.type, "lastfm-grid");
      assert.equal(template.elements.length > 0, true);
    });
  });
});
