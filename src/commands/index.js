import addn from './addn.js'
import alb from './alb.js'
import art from './art.js'
import collage from './collage.js'
import inlineQuery from './inlineQuery.js'
import ln from './ln.js'
import rankin from './rankin.js'
import rankout from './rankout.js'
import reg from './reg.js'
import rmvn from './rmvn.js'
import story from './story.js'
import top from './top.js'

// Start command
const start = async (ctx) => {

  const { first_name } = ctx.update.message.from

  try {

    await ctx.replyWithChatAction('typing')

    await ctx.reply(
      `Hello, ${first_name} 👋\n` +
      `\nWelcome to the telelast bot 🤖🎵\n` +
      `\nUse /reg to set your Lastfm’s username\n` +
      `\nType / or /help to see a list of valid commands\n` +
      `\nAccess @telelastfmnews for server status and news 📰`
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
      `\n\`/collage columnsxrows period\` - Generate a grid collage` +
      `\n\`/top mediatype period\` - Generate a top scrobbles collage` +
      `\n\`/story mediatype period\` - Generate a image of your latest scrobble`
    )

  } catch (error) {
    console.error(error)
  }
}

export {
  start,
  help,
  ln,
  alb,
  art,
  reg,
  addn,
  rmvn,
  collage,
  inlineQuery,
  top,
  story,
  rankin,
  rankout
}
