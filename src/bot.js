const { Telegraf } = require('telegraf')
const express = require('express')

//Commands
const { ln, alb } = require('./commands')


const token = '5028529308:AAE_Y6ZE8vKRVi6b8o5lFEI4ulRMb5JvSxc'
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
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

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
//bot.telegram.setWebhook(`https://b2a4-2804-14c-878d-9d59-5086-4d3b-4cdf-b1a0.ngrok.io${secretPath}`)

const app = express()

app.get('/', (req, res) => res.send('Hello World!'))

// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath))

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})