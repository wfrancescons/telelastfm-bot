import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { initDatabase } from "@/database/schema.ts";
import { deleteUser, setLastfmUsername } from "@/database/services/users.ts";
import type { Update } from "grammy/types";
import { createMockBot } from "./helpers/mockBot.ts";
import { createTestUpdate } from "./helpers/testUpdates.ts";

const TEST_USER_IDS = [
  700001,
  700002,
  700003,
  710001,
  710002,
  710003,
  710004,
  720001,
  720002,
  730001,
  730002,
  740001,
  750001,
  750002,
  760001,
  760002,
  760003,
];

const originalFetch = globalThis.fetch;

function setupLastfmFetchMock() {
  globalThis.fetch = (input: string | URL | Request) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

    if (url.includes("ws.audioscrobbler.com/2.0/")) {
      const urlObj = new URL(url);
      const method = urlObj.searchParams.get("method") || "";
      const user = urlObj.searchParams.get("user") ||
        urlObj.searchParams.get("username") || "testfmuser";

      if (user === "invalid_user") {
        return Promise.resolve(
          new Response(
            JSON.stringify({ error: 6, message: "User not found" }),
            { status: 404, headers: { "content-type": "application/json" } },
          ),
        );
      }

      if (method === "user.getInfo") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              user: {
                name: user,
                realname: "Test User",
                playcount: "15200",
                artist_count: "450",
                album_count: "620",
                track_count: "2300",
                url: `https://www.last.fm/user/${user}`,
                image: [
                  { "#text": "https://example.com/avatar.png", size: "large" },
                ],
                registered: { unixtime: "1600000000" },
                country: "Brazil",
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      if (method === "user.getRecentTracks") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              recenttracks: {
                track: [
                  {
                    name: "Weird Fishes/Arpeggi",
                    artist: { "#text": "Radiohead" },
                    album: { "#text": "In Rainbows" },
                    url: "https://www.last.fm/music/Radiohead/_/Weird+Fishes",
                    image: [
                      {
                        "#text": "https://example.com/cover.png",
                        size: "large",
                      },
                    ],
                    "@attr": { nowplaying: "true" },
                  },
                ],
                "@attr": { totalPages: "1", total: "15200" },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      if (method === "user.getTopTracks") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              toptracks: {
                track: [
                  {
                    name: "Weird Fishes/Arpeggi",
                    artist: { name: "Radiohead" },
                    playcount: "42",
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      if (method === "track.getInfo") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              track: {
                name: "Weird Fishes/Arpeggi",
                artist: { name: "Radiohead" },
                album: { title: "In Rainbows" },
                userplaycount: "42",
                playcount: "1500000",
                userloved: "1",
                duration: "318000",
                toptags: {
                  tag: [{ name: "art rock" }, { name: "indie" }],
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      if (method === "album.getInfo") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              album: {
                name: "In Rainbows",
                artist: "Radiohead",
                userplaycount: "128",
                playcount: "12000000",
                listeners: "800000",
                image: [
                  { "#text": "https://example.com/album.png", size: "large" },
                ],
                tags: {
                  tag: [{ name: "alternative rock" }],
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }

      if (method === "artist.getInfo") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              artist: {
                name: "Radiohead",
                stats: {
                  userplaycount: "512",
                  playcount: "450000000",
                  listeners: "5500000",
                },
                image: [
                  { "#text": "https://example.com/artist.png", size: "large" },
                ],
                tags: {
                  tag: [{ name: "rock" }, { name: "electronic" }],
                },
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }
    }

    return Promise.resolve(
      new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
}

describe("GrammY Bot Commands (Update Handling & API Transformers)", () => {
  before(async () => {
    await initDatabase();
    for (const id of TEST_USER_IDS) {
      await deleteUser(id);
    }
    setupLastfmFetchMock();
  });

  after(async () => {
    for (const id of TEST_USER_IDS) {
      await deleteUser(id);
    }
    globalThis.fetch = originalFetch;
  });

  describe("/start command", () => {
    it("should respond with welcome message and keyboard", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/start", {
        userId: 111222,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendChatAction = filterCalls("sendChatAction");
      assert.equal(sendChatAction.length >= 1, true);
      assert.equal(sendChatAction[0].payload.action, "typing");

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Hello, Alice/);
      assert.match(text, /Welcome to the telelastfm bot/);
      assert.match(text, /\/setlf/);
    });
  });

  describe("/privacy command", () => {
    it("should send privacy policy and terms of use", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/privacy", {
        userId: 333444,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Termos de Uso e Política de Privacidade/);
      assert.match(text, /Coleta de Dados/);
    });
  });

  describe("/help command", () => {
    it("should return the list of valid commands", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/help", {
        userId: 555666,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Valid commands:/);
      assert.match(text, /\/gridlf/);
      assert.match(text, /\/vinyllf/);
      assert.match(text, /\/calendarlf/);
      assert.match(text, /\/toplf/);
      assert.match(text, /\/profilelf/);
      assert.match(text, /\/melf/);
      assert.match(text, /\/youlf/);
    });
  });

  describe("/setlf command", () => {
    it("should instruct user when called without username argument", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/setlf", { userId: 700001 });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /What's your username on Last\.fm\?/i);
      assert.match(text, /\/setlf your_username/i);
    });

    it("should fail when username is not found on Last.fm", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/setlf invalid_user", {
        userId: 700002,
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /doesn't seem to be a valid Last\.fm username/i);
    });

    it("should register valid Last.fm username successfully", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/setlf alice_fm", { userId: 700003 });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /alice_fm set as your Last\.fm username/i);
    });
  });

  describe("/lf command", () => {
    it("should prompt user to sign up if no Last.fm account is linked", async () => {
      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/lf", { userId: 710001 });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /You need to sign up first/i);
    });

    it("should return formatted current scrobble when user is registered", async () => {
      await setLastfmUsername(710002, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/lf", {
        userId: 710002,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice.*is now listening to:/i);
      assert.match(text, /Weird Fishes\/Arpeggi/i);
      assert.match(text, /In Rainbows/i);
      assert.match(text, /Radiohead/i);
      assert.match(text, /43 scrobbles so far/i);
    });

    it("should check scrobble of replied user when replying to their message", async () => {
      await setLastfmUsername(710003, "bob_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/lf", {
        userId: 710004,
        firstName: "Charlie",
        replyToMessage: {
          userId: 710003,
          firstName: "Bob",
          username: "bob",
          text: "Hey listen to this",
        },
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Bob.*is now listening to:/i);
      assert.match(text, /Radiohead/i);
    });
  });

  describe("/alblf command", () => {
    it("should return current album scrobble for registered user", async () => {
      await setLastfmUsername(720001, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/alblf", {
        userId: 720001,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice.*is now listening to:/i);
      assert.match(text, /In Rainbows/i);
      assert.match(text, /Radiohead/i);
      assert.match(text, /129 scrobbles so far/i);
    });

    it("should support custom album search with 'Album - Artist'", async () => {
      await setLastfmUsername(720002, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/alblf In Rainbows - Radiohead", {
        userId: 720002,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice.*listened to:/i);
      assert.match(text, /In Rainbows/i);
      assert.match(text, /Radiohead/i);
    });
  });

  describe("/artlf command", () => {
    it("should return current artist scrobble for registered user", async () => {
      await setLastfmUsername(730001, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/artlf", {
        userId: 730001,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice.*is now listening to:/i);
      assert.match(text, /Radiohead/i);
      assert.match(text, /513 scrobbles so far/i);
    });

    it("should support custom artist search", async () => {
      await setLastfmUsername(730002, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/artlf Radiohead", {
        userId: 730002,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice.*listened to:/i);
      assert.match(text, /Radiohead/i);
    });
  });

  describe("/profilelf command", () => {
    it("should return user profile overview, stats and inline button", async () => {
      await setLastfmUsername(740001, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/profilelf", {
        userId: 740001,
        firstName: "Alice",
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice's Last\.fm/);
      assert.match(text, /Scrobbles:\s*15,200/);
      assert.match(text, /Artists:\s*450/);
      assert.match(text, /Albums:\s*620/);
      assert.match(text, /Tracks:\s*2,300/);

      // Verify inline keyboard button to Last.fm profile exists
      const replyMarkup = sendMessages[0].payload.reply_markup as {
        inline_keyboard?: Array<Array<{ text: string; url: string }>>;
      };
      assert.ok(replyMarkup?.inline_keyboard);
      assert.equal(replyMarkup.inline_keyboard[0][0].text, "View on Last.fm");
      assert.match(
        replyMarkup.inline_keyboard[0][0].url,
        /last\.fm\/user\/alice_fm/,
      );
    });
  });

  describe("/melf command", () => {
    it("should reject when not replying to a message", async () => {
      await setLastfmUsername(750001, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/melf", { userId: 750001 });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /reply to another user's message/i);
    });

    it("should compare scrobbles when replying to a music bot scrobble", async () => {
      await setLastfmUsername(750002, "alice_fm");

      const botMessageText =
        `Bob is now listening to:\n🎶 Weird Fishes/Arpeggi\n💿 In Rainbows\n🧑‍🎤 Radiohead\n\n42 scrobbles so far`;

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/melf", {
        userId: 750002,
        firstName: "Alice",
        replyToMessage: {
          userId: 123456789, // Bot's user id from DEFAULT_TEST_BOT_INFO
          username: "telelastfmbot",
          firstName: "telelastfmbot",
          isBot: true,
          text: botMessageText,
        },
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Alice.*listened to:/i);
      assert.match(text, /Weird Fishes\/Arpeggi/i);
      assert.match(text, /Radiohead/i);
    });
  });

  describe("/youlf command", () => {
    it("should reject when not replying to a message", async () => {
      await setLastfmUsername(760001, "alice_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/youlf", { userId: 760001 });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /reply to another user's message/i);
    });

    it("should check scrobbles of replied user for caller's current track", async () => {
      await setLastfmUsername(760002, "alice_fm");
      await setLastfmUsername(760003, "bob_fm");

      const { bot, filterCalls } = createMockBot();
      const update = createTestUpdate("/youlf", {
        userId: 760002,
        firstName: "Alice",
        replyToMessage: {
          userId: 760003,
          firstName: "Bob",
          username: "bob",
          text: "Hello!",
        },
      });

      await bot.handleUpdate(update);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 1);
      const text = sendMessages[0].payload.text as string;
      assert.match(text, /Bob.*listened to:/i);
      assert.match(text, /Weird Fishes\/Arpeggi/i);
      assert.match(text, /Radiohead/i);
    });
  });

  describe("Channel ignore middleware via bot.handleUpdate", () => {
    it("should not process commands sent as channel posts", async () => {
      const { bot, filterCalls } = createMockBot();

      const channelUpdate = {
        update_id: 888999,
        channel_post: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: -100123456789, title: "Test Channel", type: "channel" },
          text: "/start",
        },
      } as unknown as Update;

      await bot.handleUpdate(channelUpdate);

      const sendMessages = filterCalls("sendMessage");
      assert.equal(sendMessages.length, 0);
    });
  });
});
