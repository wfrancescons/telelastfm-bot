import { Telegraf } from 'telegraf'
import config from './config.js'
import sequelize from './database/database.js'

import * as Commands from './commands/commands.js'
import commandLogger from './middlewares/commandLogger.js'
import ignoreChannelMessage from './middlewares/ignoreChannelMessages.js'
import parseArgs from './middlewares/parseArgs.js'
import throttleCommands from './middlewares/throttleCommands.js'

const bot = new Telegraf(config.bot.token)

try {
  console.log('BOT: starting components')

  // Try to connect to database
  await sequelize.authenticate()

  // Set bot 'Description'
  bot.telegram.setMyDescription(
    'Share your last.fm scrobbles with your friends 🎵\n' +
    'Customize artists\' names with nicks 🙂'
  )

  // Set bot 'About'
  const aboutDescription = `Share your last.fm scrobbles with your friends 🎵\n` +
    `\n📰 News: ${config.bot.news_channel}\n` +
    `💬 Need help? Support: ${config.bot.support_chat}`

  if (aboutDescription.length <= 120) {
    bot.telegram.setMyShortDescription(aboutDescription)
  } else console.log(`BOT: 'About' section unchanged as string is longer than 120 characters`)

  // Set command descriptions
  bot.telegram.setMyCommands([
    { command: 'lf', description: 'Send your last track scrobble' },
    { command: 'alblf', description: 'Send your last album scrobble' },
    { command: 'artlf', description: 'Send your last artist scrobble' },
    { command: 'setlf', description: 'Set your Lastfm username' },
    { command: 'storylf', description: 'Generate a story collage' },
    { command: 'gridlf', description: 'Generate a grid collage' },
    { command: 'toplf', description: 'Generate a top scrobbles collage' },
    { command: 'help', description: 'Send a list of valid commands' }
  ])

  bot.use(ignoreChannelMessage)
  bot.use(throttleCommands)
  bot.use(parseArgs)
  bot.use(commandLogger)

  // Set bot response
  bot.start((ctx) => Commands.start(ctx))
  bot.help((ctx) => Commands.help(ctx))

  bot.command('collage', (ctx) => ctx.reply(`Comando alterado para /gridlf\nMais informações: ${config.bot.news_channel}`))

  bot.command('lf', (ctx) => {
    (async () => {
      await Commands.lf(ctx)
    })()
  })
  bot.command('alblf', (ctx) => {
    (async () => {
      await Commands.alblf(ctx)
    })()
  })
  bot.command('artlf', (ctx) => {
    (async () => {
      await Commands.artlf(ctx)
    })()
  })
  bot.command('setlf', (ctx) => {
    (async () => {
      await Commands.setlf(ctx)
    })()
  })
  bot.command('storylf', (ctx) => {
    (async () => {
      await Commands.storylf(ctx)
    })()
  })
  bot.command('gridlf', (ctx) => {
    (async () => {
      await Commands.gridlf(ctx)
    })()
  })
  bot.command('toplf', (ctx) => {
    (async () => {
      await Commands.toplf(ctx)
    })()
  })

  bot.command('adminlf', (ctx) => {
    (async () => {
      await Commands.adminlf(ctx)
    })()
  })

  //bot.command('rankin', (ctx) => Commands.rankin(ctx))
  //bot.command('rankout', (ctx) => Commands.rankout(ctx))

  bot.on('inline_query', (ctx) => {
    (async () => {
      Commands.inlineQuery(ctx)
    })()
  })

  // Set development webhook
  if (config.environment === 'development') {
    bot.startPolling()
  } else {
    bot.launch()
  }

  console.log(`BOT: running in ${config.environment} environment`)
} catch (error) {
  console.error('BOT: error when starting - ', error)
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default bot
