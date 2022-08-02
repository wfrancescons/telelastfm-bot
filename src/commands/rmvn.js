const { deleteNick } = require('../controller/artist')

const rmvn = (ctx) => {
    ctx.replyWithChatAction('typing')

    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text

    const [ command, artistNick ] = text.split(' ')
    if (!artistNick) return ctx.reply('Utilize o comando /rmvn passando o nome do artista. \nExemplo: \'/rmvn Taylor Swift\' \nTente novamente, por favor.')

    deleteNick(chat_id, artistNick.toLowerCase())
        .then(data => {
            if (!data) return ctx.reply('Não encontrei ninguém com esse nome nos meus registros 🤔 \nTente novamente.')
            return ctx.reply(`OK! 📝 \nRemovi o nome personalizado 🙂`)
        })
        .catch(erro => {
            console.log(erro)
            ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
        })
}

module.exports = rmvn