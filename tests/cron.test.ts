import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { initDatabase } from "@/database/schema.ts";
import {
  deleteGroupFromRank,
  findOrCreateRecord,
  getAllRankGroups,
  getAllRankUsers,
} from "@/database/services/rankGroupParticipants.ts";
import { setLastfmUsername } from "@/database/services/users.ts";
import {
  getUserScrobblesPlaycount,
  setUserScrobbles,
} from "@/database/services/weeklyScrobblesPlaycount.ts";
import sendMessages from "@/cron/sendMessages.ts";
import updateUserScrobbles from "@/cron/updateUserScrobbles.ts";
import updateValidUsers from "@/cron/updateValidUsers.ts";
import { createMockBot } from "./helpers/mockBot.ts";
import { GrammyError } from "grammy";

const originalFetch = globalThis.fetch;

describe("Cron Job Weekly Chart Race", () => {
  before(async () => {
    await initDatabase();
    await deleteGroupFromRank(-100999);
    await deleteGroupFromRank(-100888);

    globalThis.fetch = (input: string | URL | Request) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

      if (url.includes("user.getTopTracks")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              toptracks: {
                track: [
                  {
                    name: "Track A",
                    artist: { name: "Artist A" },
                    playcount: "75",
                  },
                  {
                    name: "Track B",
                    artist: { name: "Artist B" },
                    playcount: "25",
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      return Promise.resolve(
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    };
  });

  after(async () => {
    await deleteGroupFromRank(-100999);
    await deleteGroupFromRank(-100888);
    globalThis.fetch = originalFetch;
  });

  it("should update user scrobbles for enrolled rank participants using 7day period", async () => {
    const testUserId = 880001;
    await setLastfmUsername(testUserId, "cron_alice");
    await findOrCreateRecord(-100999, testUserId);

    await updateUserScrobbles();

    const stats = await getUserScrobblesPlaycount(testUserId);
    assert.ok(stats);
    // 75 + 25 = 100 scrobbles across 2 tracks
    assert.equal(stats.scrobbles_playcount, 100);
    assert.equal(stats.tracks_playcount, 2);
  });

  it("should clean up dead groups when bot is kicked (403) during updateValidUsers", async () => {
    const deadChatId = -100888;
    const testUserId = 880002;
    await setLastfmUsername(testUserId, "cron_bob");
    await findOrCreateRecord(deadChatId, testUserId);

    const { bot } = createMockBot();
    // Simulate 403 Forbidden: bot was kicked from group
    bot.api.getChatMember = () => {
      const err = new GrammyError(
        "Call to 'getChatMember' failed!",
        {
          ok: false,
          error_code: 403,
          description: "Forbidden: bot was kicked from the supergroup chat",
        },
        "getChatMember",
        {},
      );
      return Promise.reject(err);
    };

    await updateValidUsers(bot);

    const groups = await getAllRankGroups();
    assert.equal(groups.includes(deadChatId), false);
  });

  it("should send weekly chart ranking message formatted with English numbers and medals", async () => {
    const testChatId = -100999;
    const userA = 880010;
    const userB = 880011;

    await setLastfmUsername(userA, "user_gold");
    await setLastfmUsername(userB, "user_silver");

    await setUserScrobbles(userA, { scrobbles: 1250, tracks: 50 });
    await setUserScrobbles(userB, { scrobbles: 840, tracks: 30 });

    try {
      await findOrCreateRecord(testChatId, userA);
    } catch {
      // Ignore if already registered
    }
    try {
      await findOrCreateRecord(testChatId, userB);
    } catch {
      // Ignore if already registered
    }

    const { bot, filterCalls } = createMockBot();
    bot.api.getChatMember = (_chatId: number, userId: number) => {
      return Promise.resolve({
        status: "member",
        user: {
          id: userId,
          is_bot: false,
          first_name: userId === userA ? "GoldUser" : "SilverUser",
          username: userId === userA ? "golduser" : "silveruser",
        },
      } as unknown as ReturnType<typeof bot.api.getChatMember>);
    };

    await sendMessages(bot);

    const sendMessagesCalls = filterCalls("sendMessage");
    const groupCall = sendMessagesCalls.find(
      (c) => c.payload.chat_id === testChatId,
    );
    assert.ok(groupCall);

    const text = groupCall.payload.text as string;
    assert.match(text, /Weekly Tracks Chart/);
    assert.match(text, /🥇/);
    assert.match(text, /GoldUser/);
    assert.match(text, /1\.250 scrobbles/); // Thousands formatted with dot
    assert.match(text, /🥈/);
    assert.match(text, /SilverUser/);
    assert.match(text, /840 scrobbles/);
  });

  it("should evict user from all rank groups after 2 consecutive weeks of 0 scrobbles", async () => {
    const testChatId = -100999;
    const inactiveUser = 880020;
    await setLastfmUsername(inactiveUser, "inactive_zero");

    try {
      await findOrCreateRecord(testChatId, inactiveUser);
    } catch {
      // Ignore if already registered
    }

    // Mock fetch returning 0 tracks / 0 scrobbles for inactive_zero
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (input: string | URL | Request) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

      if (url.includes("inactive_zero")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              toptracks: { track: [] },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }
      return previousFetch(input);
    };

    try {
      // Week 1: Run updateUserScrobbles -> 0 scrobbles, consecutive_zero_weeks = 1
      await updateUserScrobbles();

      let stats = await getUserScrobblesPlaycount(inactiveUser);
      assert.ok(stats);
      assert.equal(stats.scrobbles_playcount, 0);
      assert.equal(stats.consecutive_zero_weeks, 1);

      // Verify user is STILL in rank group after only 1 week with 0 scrobbles
      let rankUsers = await getAllRankUsers();
      assert.ok(rankUsers.some((u) => u.telegram_id === inactiveUser));

      // Week 2: Run updateUserScrobbles -> 0 scrobbles, consecutive_zero_weeks = 2 -> Eviction
      await updateUserScrobbles();

      stats = await getUserScrobblesPlaycount(inactiveUser);
      assert.ok(stats);
      assert.equal(stats.scrobbles_playcount, 0);
      assert.equal(stats.consecutive_zero_weeks, 0); // Reset after eviction

      // Verify user has been REMOVED from rank groups
      rankUsers = await getAllRankUsers();
      assert.equal(rankUsers.some((u) => u.telegram_id === inactiveUser), false);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("should reset zero-scrobble streak if user scrobbles in the second week", async () => {
    const testChatId = -100999;
    const recoveryUser = 880021;
    await setLastfmUsername(recoveryUser, "recovery_user");

    try {
      await findOrCreateRecord(testChatId, recoveryUser);
    } catch {
      // Ignore if already registered
    }

    let weekNumber = 1;
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (input: string | URL | Request) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

      if (url.includes("recovery_user")) {
        if (weekNumber === 1) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ toptracks: { track: [] } }),
              { status: 200, headers: { "content-type": "application/json" } },
            ),
          );
        } else {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                toptracks: {
                  track: [
                    { name: "Back", artist: { name: "Artist" }, playcount: "42" },
                  ],
                },
              }),
              { status: 200, headers: { "content-type": "application/json" } },
            ),
          );
        }
      }
      return previousFetch(input);
    };

    try {
      // Week 1: 0 scrobbles -> consecutive_zero_weeks = 1
      weekNumber = 1;
      await updateUserScrobbles();
      let stats = await getUserScrobblesPlaycount(recoveryUser);
      assert.ok(stats);
      assert.equal(stats.consecutive_zero_weeks, 1);

      // Week 2: 42 scrobbles -> consecutive_zero_weeks resets to 0
      weekNumber = 2;
      await updateUserScrobbles();
      stats = await getUserScrobblesPlaycount(recoveryUser);
      assert.ok(stats);
      assert.equal(stats.scrobbles_playcount, 42);
      assert.equal(stats.consecutive_zero_weeks, 0);

      // Still in rank!
      const rankUsers = await getAllRankUsers();
      assert.ok(rankUsers.some((u) => u.telegram_id === recoveryUser));
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
