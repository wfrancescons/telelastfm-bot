const { setLastfmUser } = require('../controller/user')

const reg = (ctx) => {
    ctx.replyWithChatAction('typing')

    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, arg] = text

    if (!arg) return ctx.replyWithMarkdown('Type /reg with with your Lastfm\'s username. \nExample: `/reg lastfmusername` \nPlease, try again 🙂')

    setLastfmUser(telegram_id, arg)
        .then(user => {
            if (!user) return ctx.reply(`'${arg}' doesn't seem to be a valid Lastfm's username 🤔 \nPlease, try again`)
            return ctx.reply(`'${arg}' set as your Lastfm's username ☑️`)
        })
        .catch(erro => {
            console.log(erro)
            ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
        })
}

module.exports = reg