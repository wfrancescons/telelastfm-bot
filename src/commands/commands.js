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

import { logCommand } from '../database/services/commandUsageLog.js'
import rankinlf from './rankinlf.js'
import rankoutlf from './rankoutlf.js'

async function start(ctx) {

  const first_name = ctx.update.message.from.first_name
  const telegram_id = ctx.message.from.id
  const chat_id = ctx.message.chat.id

  logCommand('start', telegram_id, chat_id)

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
      `\nAccess ${config.bot.news_channel} for news and server status\n` +
      `\nBy using this bot, you agree to our Terms of Use and Privacy Policy available at /privacy`

    await sendTextMessage(ctx, message, extra)

  } catch (error) {
    console.error(error)
  }
}

// Help command
async function help(ctx) {

  const telegram_id = ctx.message.from.id
  const chat_id = ctx.message.chat.id

  logCommand('help', telegram_id, chat_id)

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

  const telegram_id = ctx.message.from.id
  const chat_id = ctx.message.chat.id

  logCommand('privacy', telegram_id, chat_id)

  try {

    const extra = {
      reply_to_message_id: ctx.message?.message_id,
      parse_mode: 'HTML',
      entities: []
    }

    const message = `<strong>Termos de Uso e Política de Privacidade do telelastfm</strong>

<strong>1. Coleta de Dados</strong>
O telelastfm coleta apenas as informações essenciais para oferecer uma experiência personalizada. Os dados coletados são:
- <strong>Informações do usuário no Telegram:</strong> ID, primeiro nome e nome de usuário.
- <strong>Dados enviados ao bot:</strong> Nome de usuário do Lastfm.
- <strong>Informações do Lastfm:</strong> Nome de usuário e contagem de reproduções.

<strong>2. Uso de Dados</strong>
Os dados coletados são utilizados exclusivamente para o funcionamento do bot e para melhorar a experiência do usuário.
- <strong>Informações do Telegram:</strong> Usadas para identificação e comunicação.
- <strong>Informações do Lastfm:</strong> Utilizadas para integrar e personalizar os serviços.

<strong>3. Compartilhamento de Dados</strong>
Os dados não são compartilhados com terceiros, exceto quando exigido por lei. Todas as informações são armazenadas com segurança.

<strong>4. Dados fornecidos pelo Lastfm</strong>
Nomes de faixas, álbuns, artistas, tags, contagem de reproduções e imagens são fornecidos pelo Lastfm. Qualquer divergência, reivindicação, reclamação ou solicitação deve ser tratada diretamente no site <u><a href="https://last.fm" target="_blank">last.fm</a></u>.

<strong>Observação:</strong> <em>As informações do Telegram são públicas e não revelam seus dados pessoais reais.</em>`

    await sendTextMessage(ctx, message, extra)

  } catch (error) {
    console.error(error)
  }
}

export {
  alblf, artlf, botstatuslf, gridlf, help, inlineQuery, lf, melf, privacy, rankinlf, rankoutlf, setlf, start, storylf, youlf
}

