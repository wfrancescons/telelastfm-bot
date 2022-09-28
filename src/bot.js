import { Telegraf } from 'telegraf'
import connectToDb from './database/connect.js'
import config from './config.js'
import { launchBrowser } from './handlers/collage/htmlToImage.js'

import {
  handleStart,
  handleHelp,
  handleLn,
  handleAlb,
  handleArt,
  handleReg,
  handleAddn,
  handleRmvn,
  handleStory
} from './handlers/index.js'

const bot = new Telegraf(config.bot_token)

connectToDb()
launchBrowser()

// Set bot response
bot.start((ctx) => handleStart(ctx))
bot.help((ctx) => handleHelp(ctx))

bot.command('ln', (ctx) => handleLn(ctx))
bot.command('alb', (ctx) => handleAlb(ctx))
bot.command('art', (ctx) => handleArt(ctx))
bot.command('reg', (ctx) => handleReg(ctx))
bot.command('addn', (ctx) => handleAddn(ctx))
bot.command('rmvn', (ctx) => handleRmvn(ctx))
bot.command(['story', 'collage'], (ctx) => handleStory(ctx))

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