const { getArtistListeningNow } = require('../controller/lastfm')
const { getLastfmUser } = require('../controller/user')
const { getNicks } = require('../controller/artist')

// Artist: what artist is scrobbling
const art = async (ctx) => {

    ctx.replyWithChatAction('typing')

    const chat_id = ctx.message.chat.id
    const { first_name } = ctx.update.message.from

    try {
        const lastfm_user = await getLastfmUser(ctx)

        if (!lastfm_user) return ctx.replyWithMarkdown('Type `/reg lastfmusername` to set your Lastfm\'s username')

        const {
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getArtistListeningNow(lastfm_user)

        let artist_nick = ''
        const allChatNicks = await getNicks(chat_id)
        if (allChatNicks) {
            const index = allChatNicks.findIndex(nick => nick.artist_name === artist.toLowerCase())
            if (index !== -1) {
                artist_nick = allChatNicks[index].artist_nick
            }
        }

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
            `\n🧑‍🎤 ${artist_nick ? `${artist_nick} (${artist})` : artist} \n` +
            `\n📈 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`

        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(artist_nick ? artist_nick : artist),
            length: (artist_nick ? artist_nick : artist).length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📈'),
            length: '📈'.length,
            type: 'text_link',
            url: image
        }]

        if (artist_nick) entities.push({
            offset: text.indexOf(artist),
            length: artist.length,
            type: 'italic'
        })

        return ctx.reply(text, { entities })

    } catch (erro) {
        console.log(erro)
        if (erro == "LastFm scrobbles is equal to zero") return ctx.replyWithMarkdown('There aren\'t any scrobbles on your lastFM. 🙁\n\nIs your username correct? 🤔\nType `/reg lastfmusername` to set your Lastfm\'s username')
        return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
    }
}

module.exports = art