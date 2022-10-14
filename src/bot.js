import { Telegraf } from 'telegraf'
import connectToDb from './database/connect.js'
import config from './config.js'
import { launchBrowser } from './scripts/htmlToImage.js'

import * as Commands from './commands/index.js'

const bot = new Telegraf(config.bot_token)

connectToDb()
launchBrowser()

// Set bot response
bot.start((ctx) => Commands.start(ctx))
bot.help((ctx) => Commands.help(ctx))

bot.command('ln', (ctx) => Commands.ln(ctx))
bot.command('alb', (ctx) => Commands.alb(ctx))
bot.command('art', (ctx) => Commands.art(ctx))
bot.command('reg', (ctx) => Commands.reg(ctx))
bot.command('addn', (ctx) => Commands.addn(ctx))
bot.command('rmvn', (ctx) => Commands.rmvn(ctx))
bot.command('story', (ctx) => Commands.story(ctx))
bot.command('collage', (ctx) => Commands.collage(ctx))

// Set development webhook
if (config.environment === 'development') {
  import('node:http').then((http) => {
    http.createServer(bot.webhookCallback('/secret-path')).listen(3000)
  })
}

bot.launch()

console.log(`Running in ${config.environment} environment`)

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))