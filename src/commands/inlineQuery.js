import { getTrackListeningNow } from '../controller/lastfm.js'
import { getNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import lnModel from './models/lnModel.js'

// Listening now: what track is scrobbling
const inlineQuery = async (ctx) => {

    const telegram_id = ctx.update.inline_query.from.id
    const first_name = ctx.update.inline_query.from.first_name

    try {

        const lastfm_user = await getLastfmUser(telegram_id)

        const {
            track,
            album,
            artist,
            image,
            userplaycount,
            lovedtrack,
            isNowPlaying
        } = await getTrackListeningNow(lastfm_user)

        let artist_nick = ''
        const hasArtistNick = await getNick(telegram_id, artist.toLowerCase())
        if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

        const data = {
            lovedtrack,
            isNowPlaying,
            track,
            album,
            artist,
            userplaycount,
            first_name,
            artist_nick,
            image
        }

        const message = lnModel(data)

        const response = [{
            type: 'article',
            id: 1,
            title: `🎶 ${track}`,
            description:
                `🧑‍🎤 ${artist_nick ? `${artist_nick} (${artist})` : artist}\n` +
                `📈 ${(userplaycount + 1).toLocaleString('pt-BR')} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
            thumb_url: image,
            input_message_content: {
                message_text: message.text,
                entities: message.entities
            }
        }]

        await ctx.answerInlineQuery(response, { is_personal: true, cache_time: 5 })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default inlineQuery