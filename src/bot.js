const environment = process.env.NODE_ENV || 'development'

if (environment === 'development') {
  console.log(environment)
  require('dotenv').config()
}

const { Telegraf } = require('telegraf')
const { getUser, updateUser } = require('./controller/user')

// Commands
const { ln, alb, art } = require('./commands')

const token = process.env.TELEGRAM_BOT_TOKEN
if (token === undefined) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)

// Run DB
require('./database/')

// Set the bot response
bot.command('ln', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const user = await getUser(ctx)

  if (user.status === 'user') {
    const { text, entities } = await ln(user.data.lastfm_username, ctx)
    ctx.reply(text, { entities })

  } else if (user.status === 'not user') {
    ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')

  } else {
    ctx.reply('Ops! Tive um problema 🥴 \n Tente novamente mais tarde.')
  }
})

bot.command('alb', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const user = await getUser(ctx)

  if (user.status === 'user') {
    const { text, entities } = await alb(user.data.lastfm_username, ctx)
    ctx.reply(text, { entities })
  } else if (user.status === 'not user') {
    ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')
  } else {
    ctx.reply('Ops! Tive um problema 🥴 \n Tente novamente mais tarde.')
  }
})

bot.command('art', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const user = await getUser(ctx)

  if (user.status === 'user') {
    const { text, entities } = await art(user.data.lastfm_username, ctx)
    ctx.reply(text, { entities })
  } else if (user.status === 'not user') {
    ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')
  } else {
    ctx.reply('Ops! Tive um problema 🥴 \n Tente novamente mais tarde.')
  }
})

bot.command('reg', async (ctx) => {
  ctx.replyWithChatAction('typing')

  const text = ctx.update.message.text.split(' ')
  const [command, arg] = text

  const user = await updateUser(ctx, arg)

  if (user.status === 'user') {
    ctx.reply(`'${arg}' salvo como seu usuário do LastFM`)
  } else if (user.status === 'not user') {
    ctx.reply(`'${arg}' não parece ser um usuário do LastFM. \n Tente novamente.`)
  } else {
    ctx.reply('Ops! Tive um problema 🥴 \n Tente novamente mais tarde.')
  }
})

if (environment === 'development') {
  require('http')
  .createServer(bot.webhookCallback('/secret-path'))
  .listen(3000)
}

bot.launch()