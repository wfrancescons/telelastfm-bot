const { Telegraf } = require('telegraf')
const express = require('express')

//Commands
const { ln, alb, art } = require('./commands')


const token = process.env.TELEGRAM_BOT_TOKEN
if (token === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)

// Set the bot response
bot.command('ln', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const listeningNow = await ln(ctx.update.message.from.username, ctx)

  ctx.replyWithHTML(listeningNow)
})

bot.command('alb', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const listeningNow = await alb(ctx.update.message.from.username, ctx)

  ctx.replyWithHTML(listeningNow)
})

bot.command('art', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const listeningNow = await art(ctx.update.message.from.username, ctx)

  ctx.replyWithHTML(listeningNow)
})

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
bot.telegram.setWebhook(`https://telelastfm-bot.herokuapp.com${secretPath}`)

const app = express()

app.get('/', (req, res) => res.send('TelelastFm API'))

// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath))

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})