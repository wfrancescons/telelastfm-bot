import { getAlbumListeningNow } from '../controller/lastfm.js'
import { getLastfmUser } from '../database/user.js'
import { getNick } from '../database/artist.js'
import replyWithError from '../scripts/replyWithError.js'

//Album: what album is scrobbling
const alb = async (ctx) => {

    const chat_id = ctx.message.chat.id
    const { first_name } = ctx.update.message.from

    try {

        await ctx.replyWithChatAction('typing')

        const lastfm_user = await getLastfmUser(ctx)

        const {
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getAlbumListeningNow(lastfm_user)

        let artist_nick = ''
        const hasArtistNick = await getNick(chat_id, artist.toLowerCase())
        if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
            `\n💿 ${album}` +
            `\n🧑‍🎤 ${artist_nick ? `${artist_nick} (${artist})` : artist} \n` +
            `\n📈 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`

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

        if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_LASTFM_USER')
        if (error === 'ZERO_SCROBBLES') return replyWithError(ctx, 'ZERO_SCROBBLES')
        if (error === 'PRIVATE_USER') return replyWithError(ctx, 'PRIVATE_USER')
        console.error(error)
        replyWithError(ctx, 'COMMON_ERROR')

    }

}

export default alb
