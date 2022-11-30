import { getArtistListeningNow } from '../controller/lastfm.js'
import { getNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'

//Artist: what artist is scrobbling
const art = async (ctx) => {

    const chat_id = ctx.message.chat.id
    let { first_name, id: telegram_id } = ctx.update.message.from

    const isReply = ctx.update.message.reply_to_message?.from.id

    if (isReply) {
        first_name = ctx.update.message.reply_to_message.from.first_name
        telegram_id = ctx.update.message.reply_to_message.from.id
    }

    try {

        await ctx.replyWithChatAction('typing')

        const lastfm_user = await getLastfmUser(telegram_id)

        const {
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getArtistListeningNow(lastfm_user)

        let artist_nick = ''
        const hasArtistNick = await getNick(chat_id, artist.toLowerCase())
        if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

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

        await ctx.reply(text, { entities })

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default art
