import ln from './ln.js'
import alb from './alb.js'
import art from './art.js'
import reg from './reg.js'
import addn from './addn.js'
import rmvn from './rmvn.js'
import story from './story.js'

// Start command
const start = async (ctx) => {

  const { first_name } = ctx.update.message.from

  try {

    await ctx.replyWithChatAction('typing')

    await ctx.reply(
      `Hello, ${first_name} 👋\n` +
      `\nWelcome to the telelast bot 🤖🎵\n` +
      `\nIf you have a Telegram username, I will use it as your Lastfm’s username.` +
      `\nIf you don't or it is different from your Lastfm, you can use /reg to set your Lastfm’s username\n` +
      `\nType / or /help to see a list of valid commands\n` +
      `\nAccess @telelastfmnews for server status and new features 📰`
    )

  } catch (error) {

    console.error(error)

  }
}

// Help command
const help = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    await ctx.replyWithMarkdown(
      `Valid commands: 🤖\n` +
      `\n/ln - Track you're scrobbling` +
      `\n/alb - Album you're scrobbling` +
      `\n/art - Artist you're scrobbling` +
      `\n\`/reg lastfmuser\` - Set your LastFm's username` +
      `\n\`/addn artist-nick\` - Set artist's nick for a chat` +
      `\n\`/rmvn artist\` - Remove artist's nick for a chat` +
      `\n\`/story mediatype period\` - Generate top scrobbles collage`
    )

  } catch (error) {

    console.error(error)

  }
}

// Collage command
const collage = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    await ctx.replyWithMarkdown(
      `Valid commands: 🤖\n` +
      `\n/ln - Track you're scrobbling` +
      `\n/alb - Album you're scrobbling` +
      `\n/art - Artist you're scrobbling` +
      `\n\`/reg lastfmuser\` - Set your LastFm's username` +
      `\n\`/addn artist-nick\` - Set artist's nick for a chat` +
      `\n\`/rmvn artist\` - Remove artist's nick for a chat` +
      `\n\`/story mediatype period\` - Generate top scrobbles collage`
    )

  } catch (error) {

    console.error(error)

  }
}

export {
  start as handleStart,
  help as handleHelp,
  ln as handleLn,
  alb as handleAlb,
  art as handleArt,
  reg as handleReg,
  addn as handleAddn,
  rmvn as handleRmvn,
  story as handleStory,
  collage as handleCollage
}