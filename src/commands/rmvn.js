const { deleteNick } = require('../controller/artist')

const rmvn = (ctx) => {
    ctx.replyWithChatAction('typing')

    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text

    const [ command ] = text.split(' ')
    const artist_nick = text.replace(command, '').trim().toLowerCase()

    if (!artist_nick) return ctx.replyWithMarkdown('Type /rmvn with artist\'s name to remove artist\'s nick. \nExample: `/rmvn Taylor Swift` \nPlease, try again 🙂')

    deleteNick(chat_id, artist_nick)
        .then(data => {
            if (!data) return ctx.reply('Didn\'t find anyone with that name in my records 🤔 \nPlease, try again.')
            return ctx.reply(`OK! 📝 \nArtist's nick removed 🙂`)
        })
        .catch(erro => {
            console.log(erro)
            ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
        })
}

module.exports = rmvn