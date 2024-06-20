import config from '../config.js'
import { sendTextMessage } from '../utils/messageSender.js'

import alblf from './alblf.js'
import artlf from './artlf.js'
import gridlf from './gridlf.js'
import inlineQuery from './inlineQuery.js'
import lf from './lf.js'
import setlf from './setlf.js'
import storylf from './storylf.js'
////import toplf from './toplf.js'

//import rmvn from './rmvn.js'
//import addn from './addn.js'
//import rankin from './rankin.js'
//import rankout from './rankout.js'

async function start(ctx) {

  const first_name = ctx.update.message.from.first_name

  try {
    ctx.replyWithChatAction('typing').cacth()

    const extra = {
      reply_to_message_id: ctx.message?.message_id,
      reply_markup: {
        inline_keyboard: [[{
          text: '💬 Add to a group',
          url: `https://t.me/${config.bot.username.replace('@', '')}?startgroup=new`
        }]]
      }
    }

    const message = `Hello, ${first_name} 👋\n` +
      `Welcome to the telelastfm bot 🔴🎵\n` +
      `\n➡️ Use /setlf to set your Lastfm username\n` +
      `\n➡️ Type / or /help to see a list of valid commands\n` +
      `\nAccess ${config.bot.news_channel} for news and server status`

    await sendTextMessage(ctx, message, extra)

  } catch (error) {
    console.error(error)
  }
}

// Help command
async function help(ctx) {

  try {
    ctx.replyWithChatAction('typing').cacth()

    const message = `Valid commands: 🤖\n` +
      `\n/lf - Track you're scrobbling` +
      `\n/alblf - Album you're scrobbling` +
      `\n/artlf - Artist you're scrobbling` +
      `\n\`/setlf your_username\` - Set your LastFm's username` +
      `\n\`/gridlf columnsxrows period\` - Generate a grid collage` +
      `\n\`/toplf mediatype period\` - Generate a top scrobbles collage` +
      `\n\`/storylf mediatype period\` - Generate a image of your latest scrobble`

    await sendTextMessage(ctx, message)

  } catch (error) {
    console.error(error)
  }
}

export {
  alblf, artlf, gridlf, help, inlineQuery, lf,
  setlf, start, storylf
}
