import config from "@/config.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";
import type { Context } from "grammy";

export async function errorHandler(
  ctx: BotContext | Context,
  error: unknown,
  info?: string,
): Promise<void> {
  const isInlineQuery = Boolean(ctx.inlineQuery);
  const replyFrom = ctx.message?.reply_to_message?.from;
  const isReplyToChannel =
    ctx.message?.reply_to_message?.sender_chat?.type === "channel";
  const isReply = Boolean(replyFrom?.id && !isReplyToChannel);

  const errorCode = typeof error === "string"
    ? error
    : error instanceof Error
    ? error.message
    : "UNKNOWN_ERROR";

  const replyParams = ctx.message
    ? { message_id: ctx.message.message_id }
    : undefined;

  try {
    switch (errorCode) {
      case "USER_NOT_FOUND": {
        if (isInlineQuery) {
          const botUsername = config.bot.username
            ? config.bot.username.replace("@", "")
            : "telelastfmbot";
          await ctx.answerInlineQuery([
            {
              type: "article",
              id: "error-user-not-found",
              title: "⚠️ User not found",
              description: "Use /setlf to set your Last.fm username",
              input_message_content: {
                message_text:
                  `⚠️ Send /setlf to @${botUsername} to set your Last.fm username`,
              },
            },
          ], { cache_time: 0 });
          break;
        }

        if (isReply && replyFrom?.first_name) {
          const msg = FormattedString
            .bold(replyFrom.first_name)
            .plain(" needs to type ")
            .code("/setlf yourlastfmusername")
            .plain(" to set a Last.fm username");

          await ctx.reply(msg.text, {
            entities: msg.entities,
            reply_parameters: replyParams,
          });
          break;
        }

        const msg = new FormattedString(
          "⚠️ You need to sign up first to use the bot\n\n",
        )
          .plain("What's your username on Last.fm? 🤔\n\n")
          .plain("➡️ Type ")
          .code("/setlf your_username")
          .plain(" to set it");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "ZERO_SCROBBLES": {
        if (isInlineQuery) {
          await ctx.answerInlineQuery([
            {
              type: "article",
              id: "error-zero-scrobbles",
              title: "⚠️ No scrobbles found",
              description: "There aren't any scrobbles in your Last.fm 🙁",
              input_message_content: {
                message_text: "⚠️ No scrobbles found in your Last.fm",
              },
            },
          ], { cache_time: 0 });
          break;
        }

        if (isReply && replyFrom?.first_name) {
          const msg = new FormattedString("There aren't any scrobbles in ")
            .bold(replyFrom.first_name)
            .plain("'s Last.fm 🙁");

          await ctx.reply(msg.text, {
            entities: msg.entities,
            reply_parameters: replyParams,
          });
          break;
        }

        const msg = new FormattedString(
          "There aren't any scrobbles in your Last.fm 🙁\n\n",
        )
          .plain("Is your username correct? 🤔\n")
          .plain("➡️ Type ")
          .code("/setlf your_username")
          .plain(" to update it");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "REG_WITHOUT_ARGS":
      case "MISSING_USERNAME": {
        const msg = new FormattedString(
          "What's your username on Last.fm? 🤔\n\n",
        )
          .plain("➡️ Type ")
          .code("/setlf your_username")
          .plain(" to set it\n\n")
          .plain("Please, try again 🙂");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "CUSTOM_ARTIST_NOT_FOUND": {
        const msg = new FormattedString(
          "I can't find any artist with that name. Did you type it correctly? 🤔\n",
        )
          .plain("➡️ Example: ")
          .code("/artlf Taylor Swift")
          .plain("\nPlease, try again 🙂");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "CUSTOM_ALBUM_NOT_FOUND": {
        const msg = new FormattedString(
          "I can't find any albums by this artist. Did you type it correctly? 🤔\n",
        )
          .plain("Type like this: ")
          .bold("album's name - artist's name")
          .plain("\n\n➡️ Example: ")
          .code("/alblf Chromatica - Lady Gaga")
          .plain("\n\nPlease, try again 🙂");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "GRID_INCORRECT_ARGS":
      case "COLLAGE_INCORRECT_ARGS": {
        const msg = new FormattedString("Invalid arguments 🤔\n\n")
          .plain(
            "✅ Type a columns x rows value greater than 0 and up to 10\n",
          )
          .plain("✅ Valid Periods: ")
          .code("overall")
          .plain(", ")
          .code("7day")
          .plain(", ")
          .code("1month")
          .plain(", ")
          .code("3month")
          .plain(", ")
          .code("6month")
          .plain(", ")
          .code("12month")
          .plain("\n\n➡️ Examples:\n")
          .code("/gridlf 3x3")
          .plain("\n")
          .code("/gridlf 5x5 7day")
          .plain("\n")
          .code("/gridlf 4x4 noplays")
          .plain("\n")
          .code("/gridlf 4x4 notitles")
          .plain("\n")
          .code("/gridlf 6x6 clean");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "STORY_INCORRECT_ARGS": {
        const msg = new FormattedString("Invalid arguments 🤔\n\n")
          .plain("✅ Valid Media Types: ")
          .code("tracks")
          .plain(", ")
          .code("albums")
          .plain(", ")
          .code("artists")
          .plain("\n\n➡️ Examples:\n")
          .code("/storylf")
          .plain("\n")
          .code("/storylf alb")
          .plain("\n")
          .code("/storylf art");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "CALENDAR_INVALID_DATE": {
        const msg = new FormattedString("Invalid arguments 🤔\n\n")
          .plain("✅ Valid Media Types: ")
          .code("tracks")
          .plain(", ")
          .code("alb")
          .plain(", ")
          .code("art")
          .plain("\n✅ Valid Date Format: ")
          .code("MM/YYYY")
          .plain(" (not in the future)\n\n➡️ Examples:\n")
          .code("/calendarlf")
          .plain("\n")
          .code("/calendarlf alb 08/2025")
          .plain("\n")
          .code("/calendarlf tracks notitles 12/2025")
          .plain("\n")
          .code("/calendarlf art clean");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "CALENDAR_NO_DATA": {
        const msg = new FormattedString(
          "No scrobbles found for that month and year 🙁\n\n",
        )
          .plain("Try choosing another month where you have listening history:\n")
          .plain("➡️ Example: ")
          .code("/calendarlf alb 08/2025");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "NOT_A_VALID_LASTFM_USER": {
        const targetUser = info || "That";
        const msg = FormattedString
          .bold(targetUser)
          .plain(" doesn't seem to be a valid Last.fm username 🤔\n")
          .plain("Please, try again 🙂");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "CANNOT_SEND_MEDIA_MESSAGES": {
        const msg = new FormattedString(
          "Sorry 😔\nI'm not allowed to send photos here 🚫📷\n\nAn admin needs to review my permissions",
        );

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "PRIVATE_USER": {
        const msg = new FormattedString(
          "Can't get your scrobbles 🥴\nYour Last.fm profile is private 🔒\nGo to ",
        )
          .bold("last.fm > settings > privacy")
          .plain(" and uncheck ")
          .bold("Hide recent listening information")
          .plain(" to use this bot.");

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "RANK_REGISTERED_USER": {
        await ctx.reply(
          "You are already participating in this group's race.\nTo exit, use /rankoutlf 😉",
          { reply_parameters: replyParams },
        );
        break;
      }

      case "RANK_PERSONAL_CHAT": {
        await ctx.reply(
          "Ranking isn't available for private chats 😔\nTry using the command in a group",
          { reply_parameters: replyParams },
        );
        break;
      }

      case "RANK_USER_NOT_FOUND": {
        await ctx.reply(
          "I couldn't find you on the runners list 🤨\n\nUse /rankinlf to join the race",
          { reply_parameters: replyParams },
        );
        break;
      }

      case "USER_CHANGED_USERNAME": {
        const supportText = config.bot.support_chat
          ? `\n\nIf the issue keeps happening, contact ${config.bot.support_chat}`
          : "";
        const msg = new FormattedString(
          "Something went wrong 🥴\nI couldn't find any Last.fm user with the username you provided.\nDid you change your Last.fm username?\nType ",
        )
          .code("/setlf yourlastfmusername")
          .plain(` to change your username.${supportText}`);

        await ctx.reply(msg.text, {
          entities: msg.entities,
          reply_parameters: replyParams,
        });
        break;
      }

      case "NOT_A_MUSIC_BOT_MESSAGE": {
        await ctx.reply(
          "Oops 🥴\n\n➡️ This command is only valid for messages with music information\n\nPlease, try again 🙂",
          { reply_parameters: replyParams },
        );
        break;
      }

      case "NOT_A_REPLY_MESSAGE":
      case "USER_NOT_FOUND_REPLY": {
        await ctx.reply(
          "➡️ In order to use this command, you need to reply to another user's message\n\nPlease, try again 🙂",
          { reply_parameters: replyParams },
        );
        break;
      }

      default: {
        const errorDesc = String(
          (error as { description?: string })?.description || "",
        );
        if (errorDesc.includes("message to delete not found")) {
          break;
        }

        console.error("Handler error:", error);

        if (isInlineQuery) {
          await ctx.answerInlineQuery([], { cache_time: 0 });
          break;
        }

        const supportText = config.bot.support_chat
          ? `\nIf the issue keeps happening, contact: ${config.bot.support_chat}`
          : "";
        await ctx.reply(
          `Something went wrong with Last.fm 🥴\nBut don't fret, let's give it another shot in a couple of minutes.${supportText}`,
          { reply_parameters: replyParams },
        );
        break;
      }
    }
  } catch (handlingErr) {
    console.error("Critical error inside errorHandler:", handlingErr);
  }
}

export default errorHandler;

