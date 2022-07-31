const { newNick } = require('../controller/artist')

const addn = (ctx) => {
    ctx.replyWithChatAction('typing')

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text

    const [ command, arg ] = text.split(' ')
    if (!arg) return ctx.reply('Utilize o comando /addn passando o nome do artista + hífen + apelido. \nExemplo: \'/addn Taylor Swift-Rainha do Pop\' \nTente novamente, por favor.')

    const [ commandAndText, artistNick ] = text.split('-')
    if(!artistNick) return ctx.reply('Utilize o comando /addn passando o nome do artista + hífen + apelido. \nExemplo: \'/addn Taylor Swift-Rainha do Pop\' \nTente novamente, por favor.')

    const artist_nick = artistNick.trim()
    const artist_name = commandAndText.replace(command, '').trim().toLowerCase()

    newNick(chat_id, { artist_name, artist_nick, telegram_id })
        .then(nick => {
            if (!nick) return ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
            return ctx.reply(`Anotado! 📝 \nA partir de agora chamarei ${commandAndText.replace(command, '').trim()} de ${artist_nick}`)
        })
        .catch(erro => {
            console.log(erro)
            ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
        })
}

module.exports = addn