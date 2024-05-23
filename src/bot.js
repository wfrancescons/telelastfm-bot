import { Telegraf } from 'telegraf'
import config from './config.js'
import connectToDb from './database/connect.js'
import { launchBrowser } from './modules/htmlToImage.js'

import * as Commands from './commands/index.js'

const bot = new Telegraf(config.bot_token)

try {
  await connectToDb()

  console.log('DATABASE: MongoDB connected!')

  //launch browser for /collage, /top and /story
  await launchBrowser().catch(error => console.error(error))

  // Set bot response
  bot.start((ctx) => Commands.start(ctx))
  bot.help((ctx) => Commands.help(ctx))

  bot.command(['ln', 'lp', 'status'], (ctx) => Commands.ln(ctx))
  bot.command(['alb', 'album'], (ctx) => Commands.alb(ctx))
  bot.command(['art', 'artist'], (ctx) => Commands.art(ctx))
  bot.command('reg', (ctx) => Commands.reg(ctx))
  bot.command('addn', (ctx) => Commands.addn(ctx))
  bot.command('rmvn', (ctx) => Commands.rmvn(ctx))
  bot.command('story', (ctx) => Commands.story(ctx))
  bot.command('collage', (ctx) => Commands.collage(ctx))
  bot.command('top', (ctx) => Commands.top(ctx))
  bot.command('rankin', (ctx) => Commands.rankin(ctx))
  bot.command('rankout', (ctx) => Commands.rankout(ctx))

  bot.on('inline_query', (ctx) => Commands.inlineQuery(ctx))

  // Set development webhook
  if (config.environment === 'development') {
    import('node:http').then((http) => {
      http.createServer(bot.webhookCallback('/secret-path')).listen(3000)
    }).catch(error => console.error(error))
  }

  bot.launch()

  import('./cron/cronjob.js')
    .then(() => console.log('CRONJOB: Task scheduled'))
    .catch(error => console.error(error))

  console.log(`BOT: Running in ${config.environment} environment`)


} catch (error) {
  console.error('DATABASE: Error connecting to MongoDB: ', error)
}

export default bot
