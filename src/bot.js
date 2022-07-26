const { Telegraf } = require('telegraf')
const express = require('express')
const { ln } = require('./commands')


const token = '5028529308:AAE_Y6ZE8vKRVi6b8o5lFEI4ulRMb5JvSxc'
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)

// Set the bot response
bot.command('ln', async (ctx) => {
  ctx.replyWithChatAction('typing')
  
  const listeningNow = await ln(ctx.update.message.from.username, ctx)

  ctx.replyWithMarkdownV2(listeningNow)
})

const secretPath = `/telegraf/${bot.secretPathComponent()}`

// Set telegram webhook
// npm install -g localtunnel && lt --port 3000
//bot.telegram.setWebhook(`https://d218-2804-14c-878d-9d59-9927-c332-c0-a398.ngrok.io${secretPath}`)

const app = express()

app.get('/', (req, res) => res.send('Hello World!'))

// Set the bot API endpoint
app.use(bot.webhookCallback(secretPath))

app.listen(3000, () => {
  console.log('Example app listening on port 3000!')
})