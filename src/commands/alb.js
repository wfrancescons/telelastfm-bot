const { getAlbumListeningNow } = require('../controller/Lastfm')
const { getLastfmUser } = require('../controller/User')

const alb = async (ctx) => {
    ctx.replyWithChatAction('typing')

    try {
        const lastfmUser = await getLastfmUser(ctx)

        if (!lastfmUser) return ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')

        const {
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getAlbumListeningNow(lastfmUser)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(album),
            length: album.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return ctx.reply(text, { entities })

    } catch (erro) {
        console.log(erro)
        ctx.reply('Ops! Tive um problema 🥴 \nTente novamente mais tarde.')
    }
}

module.exports = alb