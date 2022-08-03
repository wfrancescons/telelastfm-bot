// Help command
const help = (ctx) => {

    ctx.replyWithChatAction('typing')

    return ctx.replyWithMarkdown(`Valid commands: 🤖\n`+
    `\n/ln - Track you're scrobbling`+
    `\n/alb - Album you're scrobbling`+
    `\n/art - Artist you're scrobbling`+
    `\n\`/reg lastfmuser\` - Set your LastFm's username`+
    `\n\`/addn artist-nick\` - Set artist's nick for a chat`+
    `\n\`/rmvn artist\` - Remove artist's nick for a chat`)

}

module.exports = help