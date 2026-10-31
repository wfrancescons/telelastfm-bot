import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  acceptedCollageParams,
  acceptedMedias,
  acceptedPeriods,
  collageParamMap,
  mediaMap,
  periodMap,
} from "@/utils/validValuesMap.ts";

describe("validValuesMap", () => {
  describe("mediaMap & acceptedMedias", () => {
    it("should map common track aliases", () => {
      const trackAliases = ["tracks", "track", "music", "musica", "música", "faixa", "tra", "lf"];
      for (const alias of trackAliases) {
        assert.equal((acceptedMedias as readonly string[]).includes(alias), true, `Missing in acceptedMedias: ${alias}`);
        assert.equal(mediaMap[alias], "tracks", `Wrong mapping for: ${alias}`);
      }
    });

    it("should map album aliases", () => {
      const albumAliases = ["albums", "album", "alb"];
      for (const alias of albumAliases) {
        assert.equal((acceptedMedias as readonly string[]).includes(alias), true, `Missing in acceptedMedias: ${alias}`);
        assert.equal(mediaMap[alias], "albums", `Wrong mapping for: ${alias}`);
      }
    });

    it("should map artist aliases", () => {
      const artistAliases = ["artists", "artist", "art", "artista", "artistas"];
      for (const alias of artistAliases) {
        assert.equal((acceptedMedias as readonly string[]).includes(alias), true, `Missing in acceptedMedias: ${alias}`);
        assert.equal(mediaMap[alias], "artists", `Wrong mapping for: ${alias}`);
      }
    });
  });

  describe("collageParamMap & acceptedCollageParams", () => {
    it("should map clean / no text aliases", () => {
      const cleanAliases = ["notexts", "notext", "clean", "nonames", "nooverlay", "semtexto"];
      for (const alias of cleanAliases) {
        assert.equal((acceptedCollageParams as readonly string[]).includes(alias), true, `Missing in acceptedCollageParams: ${alias}`);
        assert.equal(collageParamMap[alias], "notexts", `Wrong mapping for: ${alias}`);
      }
    });

    it("should map no titles aliases", () => {
      const noTitlesAliases = ["notitles", "notitle", "notitulo", "semtitulo"];
      for (const alias of noTitlesAliases) {
        assert.equal((acceptedCollageParams as readonly string[]).includes(alias), true, `Missing in acceptedCollageParams: ${alias}`);
        assert.equal(collageParamMap[alias], "notitles", `Wrong mapping for: ${alias}`);
      }
    });

    it("should map no plays / no scrobbles aliases", () => {
      const noPlaysAliases = ["noplays", "noscrobbles", "noplay", "noscrobble", "semscrobble"];
      for (const alias of noPlaysAliases) {
        assert.equal((acceptedCollageParams as readonly string[]).includes(alias), true, `Missing in acceptedCollageParams: ${alias}`);
        assert.equal(collageParamMap[alias], "noplays", `Wrong mapping for: ${alias}`);
      }
    });
  });

  describe("periodMap & acceptedPeriods", () => {
    it("should map standard periods correctly", () => {
      assert.equal(periodMap["7d"], "7day");
      assert.equal(periodMap["1m"], "1month");
      assert.equal(periodMap["3m"], "3month");
      assert.equal(periodMap["6m"], "6month");
      assert.equal(periodMap["1y"], "12month");
      assert.equal(periodMap["all"], "overall");
      assert.equal((acceptedPeriods as readonly string[]).includes("7d"), true);
    });
  });
});

