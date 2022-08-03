if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const { NODE_ENV: environment, TELEGRAM_BOT_TOKEN: token } = process.env
const { Telegraf } = require('telegraf')
const Commands = require('./commands')

if (token === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!')
}

// Run DB
require('./database/')

const bot = new Telegraf(token)

// Set bot response
bot.start((ctx) => Commands.start(ctx))
bot.help((ctx) => Commands.help(ctx))
bot.command('ln', (ctx) => Commands.ln(ctx))
bot.command('alb', (ctx) => Commands.alb(ctx))
bot.command('art', (ctx) => Commands.art(ctx))
bot.command('reg', (ctx) => Commands.reg(ctx))
bot.command('addn', (ctx) => Commands.addn(ctx))
bot.command('rmvn', (ctx) => Commands.rmvn(ctx))

// Set development webhook
if (environment === 'development') {
  require('http')
    .createServer(bot.webhookCallback('/secret-path'))
    .listen(3000)
}

bot.launch()

console.log(`Running in ${environment} environment`)

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))