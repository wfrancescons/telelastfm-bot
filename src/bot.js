if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const environment = process.env.NODE_ENV
const token = process.env.TELEGRAM_BOT_TOKEN
const { Telegraf } = require('telegraf')
const ln = require('./commands/ln')
const alb = require('./commands/alb')
const art = require('./commands/art')
const reg = require('./commands/reg')

if (token === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!')
}

// Run DB
require('./database/')

const bot = new Telegraf(token)

// Set bot response
bot.command('ln', (ctx) => ln(ctx))
bot.command('alb', (ctx) => alb(ctx))
bot.command('art', (ctx) => art(ctx))
bot.command('reg', (ctx) => reg(ctx))

if (environment === 'development') {
  require('http')
    .createServer(bot.webhookCallback('/secret-path'))
    .listen(3000)
}

console.log(`Running in ${environment} environment`)

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))