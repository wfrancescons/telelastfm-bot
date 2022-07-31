const { getTrackListeningNow } = require('../controller/lastfm')
const { getLastfmUser } = require('../controller/user')
const { getNicks } = require('../controller/artist')

const ln = async (ctx) => {
    ctx.replyWithChatAction('typing')
    const chat_id = ctx.message.chat.id

    try {
        const lastfmUser = await getLastfmUser(ctx)

        if (!lastfmUser) return ctx.reply('Utilize o comando \'/reg usuariolastfm\' para se registrar')

        const {
            track,
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getTrackListeningNow(lastfmUser)

        const { first_name } = ctx.update.message.from

        let artistNick =''
        const allChatNicks = await getNicks(chat_id)
        const index = allChatNicks.findIndex(nick => nick.artist_name === artist.toLowerCase())
        if (index !== -1) {
            artistNick = allChatNicks[index].artist_nick
        }

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
            `\n🎵 ${track}` +
            `\n💽 ${album}` +
            `\n🧑‍🎤 ${artistNick ? artistNick : artist} \n` +
            `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`

        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(track),
            length: track.length,
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

module.exports = ln