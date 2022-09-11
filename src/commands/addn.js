const { newNick } = require('../controller/artist')

const addn = async (ctx) => {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text

    try {
        ctx.replyWithChatAction('typing')

        const [command, artistAndNick] = text.split(' ')
        if (!artistAndNick) return ctx.replyWithMarkdown('Type /addn with artist\'s name + hyphen + artist\'s nick. \nExample: `/addn Taylor Swift - Queen of Pop` \nPlease, try again 🙂')

        const [commandAndText, artistNick] = text.split('-')
        if (!artistNick) return ctx.replyWithMarkdown('Type /addn with artist\'s name + hyphen + artist\'s nick. \nExample: `/addn Taylor Swift - Queen of Pop` \nPlease, try again 🙂')

        const artist_nick = artistNick.trim()
        const artist_name = commandAndText.replace(command, '').trim().toLowerCase()

        const nick = await newNick(chat_id, { artist_name, artist_nick, added_by: telegram_id })

        if (!nick) return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
        return ctx.reply(`Got it! 📝 \nFrom now on I'll call ${commandAndText.replace(command, '').trim()} as ${artist_nick}`)


    } catch (erro) {
        console.log(erro)
        return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
    }
}

module.exports = addn