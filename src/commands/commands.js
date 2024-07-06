import config from '../config.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

import botstatuslf from './admin/botstatuslf.js'
import alblf from './alblf.js'
import artlf from './artlf.js'
import gridlf from './gridlf.js'
import inlineQuery from './inlineQuery.js'
import lf from './lf.js'
import melf from './melf.js'
import setlf from './setlf.js'
import storylf from './storylf.js'
import youlf from './youlf.js'
////import toplf from './toplf.js'

//import rmvn from './rmvn.js'
//import addn from './addn.js'
//import rankin from './rankin.js'
//import rankout from './rankout.js'

async function start(ctx) {

  const first_name = ctx.update.message.from.first_name

  try {
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

    const extra = {
      reply_to_message_id: ctx.message?.message_id,
      entities: []
    }

    const command_examples = {
      setfl: '/setlf your_username',
      gridlf: '/gridlf columnsxrows period',
      toplf: '/toplf mediatype period',
      storylf: '/storylf mediatype period'
    }

    const message = `Valid commands: 🤖\n` +
      `\n/lf - Track you're scrobbling` +
      `\n/alblf - Album you're scrobbling` +
      `\n/artlf - Artist you're scrobbling` +
      `\n${command_examples.setfl} - Set your LastFm's username` +
      `\n${command_examples.gridlf} - Generate a grid collage` +
      `\n${command_examples.toplf} - Generate a top scrobbles collage` +
      `\n${command_examples.storylf} - Generate a image of your latest scrobble`

    for (const example in command_examples) {
      extra.entities.push(createEntity(message.indexOf(command_examples[example]), command_examples[example].length, 'code'))
    }

    await sendTextMessage(ctx, message, extra)

  } catch (error) {
    console.error(error)
  }
}

async function privacy(ctx) {

  try {

    const extra = {
      reply_to_message_id: ctx.message?.message_id,
      entities: []
    }

    const message = `PRIVACY DATA`

    await sendTextMessage(ctx, message, extra)

  } catch (error) {
    console.error(error)
  }
}

export {
  alblf, artlf, botstatuslf, gridlf, help, inlineQuery, lf, melf, privacy, setlf, start, storylf, youlf
}

