const { setLastfmUser } = require('../controller/user')

const reg = (ctx) => {
    ctx.replyWithChatAction('typing')

    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, arg] = text

    if (!arg) return ctx.reply('Utilize o comando com seu nome de usuário do LastFM \nExemplo: \'/reg usuariolastfm\' \nTente novamente, por favor.')

    setLastfmUser(telegram_id, arg)
        .then(user => {
            if (!user) return ctx.reply(`'${arg}' não parece ser um usuário do LastFM. \nTente novamente.`)
            return ctx.reply(`'${arg}' salvo como seu usuário do LastFM`)
        })
        .catch(erro => {
            console.log(erro)
            ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
        })
}

module.exports = reg