require('dotenv').config()
const environment = process.env.NODE_ENV
const token = process.env.TELEGRAM_BOT_TOKEN
const { Telegraf } = require('telegraf')
const commands = require('./commands/index')

if (token === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!')
}

// Run DB
require('./database/')

const bot = new Telegraf(token)

// Set bot response
bot.command('ln', (ctx) => commands.ln(ctx))
bot.command('alb', (ctx) => commands.alb(ctx))
bot.command('art', (ctx) => commands.art(ctx))
bot.command('reg', (ctx) => commands.reg(ctx))

if (environment === 'development') {
  require('http')
    .createServer(bot.webhookCallback('/secret-path'))
    .listen(3000)
}

console.log(`Running in ${environment} environment`)

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))