import { getAlbumListeningNow, getArtistListeningNow, getTrackListeningNow } from '../controller/lastfm.js'
import { getNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import albModel from './models/albModel.js'
import artModel from './models/artModel.js'
import lnModel from './models/lnModel.js'

const inlineQuery = async (ctx) => {

    const telegram_id = ctx.update.inline_query.from.id
    const first_name = ctx.update.inline_query.from.first_name

    try {

        const lastfm_user = await getLastfmUser(telegram_id)

        const lastfmData = await Promise.all([
            getTrackListeningNow(lastfm_user),
            getAlbumListeningNow(lastfm_user),
            getArtistListeningNow(lastfm_user)
        ])

        const [ln, alb, art] = lastfmData

        let artist_nick = ''
        const hasArtistNick = await getNick(telegram_id, ln.artist.toLowerCase())
        if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

        ln.formattedMessage = lnModel({
            ...ln,
            first_name,
            artist_nick
        })

        alb.formattedMessage = albModel({
            ...alb,
            first_name,
            artist_nick
        })

        art.formattedMessage = artModel({
            ...art,
            first_name,
            artist_nick
        })

        const results = [
            {
                type: 'article',
                id: 1,
                title: 'Track:',
                description:
                    `🎶 ${ln.track}\n` +
                    `📈 ${(ln.userplaycount + 1).toLocaleString('pt-BR')} ${ln.userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
                thumb_url: ln.image,
                input_message_content: {
                    message_text: ln.formattedMessage.text,
                    entities: ln.formattedMessage.entities
                }
            },
            {
                type: 'article',
                id: 2,
                title: 'Album:',
                description:
                    `💿 ${alb.album}\n` +
                    `📈 ${(alb.userplaycount + 1).toLocaleString('pt-BR')} ${alb.userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
                thumb_url: alb.image,
                input_message_content: {
                    message_text: alb.formattedMessage.text,
                    entities: alb.formattedMessage.entities
                }
            },
            {
                type: 'article',
                id: 3,
                title: 'Artist:',
                description:
                    `🧑‍🎤 ${artist_nick ? `${artist_nick} (${art.artist})` : art.artist}\n` +
                    `📈 ${(art.userplaycount + 1).toLocaleString('pt-BR')} ${art.userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
                thumb_url: art.image,
                input_message_content: {
                    message_text: art.formattedMessage.text,
                    entities: art.formattedMessage.entities
                }
            }
        ]

        await ctx.answerInlineQuery(results, { is_personal: true, cache_time: 5 })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default inlineQuery