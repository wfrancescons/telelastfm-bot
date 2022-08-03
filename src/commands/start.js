// Start command
const start = (ctx) => {

    ctx.replyWithChatAction('typing')

    const { first_name } = ctx.update.message.from

    return ctx.reply(`Hello, ${first_name} 👋\n`+
    `\nWelcome to the telelast bot 🤖🎵\n`+
    `\nIf you have a Telegram username, I will use it as your Lastfm’s username.`+
    `\nIf you don't or it is different from your Lastfm, you can use /reg to set your Lastfm’s username\n`+
    `\nType / or /help to see a list of valid commands\n`+
    `\nAcess @telelastfmnews for server status and new features 📰`)

}

module.exports = start