import { logCommand } from '../database/services/commandUsageLog.js'
import { getLastfmUser } from '../database/services/user.js'
import { updateStreaks } from '../database/services/userStreaks.js'
import errorHandler from '../handlers/errorHandler.js'
import limitText from '../helpers/limitText.js'
import { getAlbumListeningNow, getArtistListeningNow, getTrackListeningNow } from '../services/lastfm.js'
import alblfFormatter from './formatters/alblfFormatter.js'
import artlfFormatter from './formatters/artlfFormatter.js'
import lfFormatter from './formatters/lfFormatter.js'

async function inlineQuery(ctx) {

    const telegram_id = ctx.update.inline_query.from.id
    const first_name = ctx.update.inline_query.from.first_name

    logCommand('inline_query', telegram_id, telegram_id)

    try {

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        const user_streaks = await updateStreaks(telegram_id)

        const lastfm_data = await Promise.all([
            getTrackListeningNow(lastfm_user),
            getAlbumListeningNow(lastfm_user),
            getArtistListeningNow(lastfm_user)
        ])

        const [lf, alblf, artlf] = lastfm_data

        lf.formattedMessage = lfFormatter({
            first_name,
            streaks_count: user_streaks.streaks_count,
            ...lf
        })

        alblf.formattedMessage = alblfFormatter({
            first_name,
            streaks_count: user_streaks.streaks_count,
            ...alblf
        })

        artlf.formattedMessage = artlfFormatter({
            first_name,
            streaks_count: user_streaks.streaks_count,
            ...artlf
        })

        const results = [
            {
                type: 'article',
                id: 1,
                title: 'Track:',
                description: `🎶 ${limitText(lf.track, 15)}\n` +
                    `📈 ${(lf.userplaycount + 1).toLocaleString('pt-BR')} ${lf.userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
                thumb_url: lf.image.medium,
                input_message_content: {
                    message_text: lf.formattedMessage.text,
                    entities: lf.formattedMessage.entities
                }
            },
            {
                type: 'article',
                id: 2,
                title: 'Album:',
                description: `💿 ${limitText(alblf.album, 15)}\n` +
                    `📈 ${(alblf.userplaycount + 1).toLocaleString('pt-BR')} ${alblf.userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
                thumb_url: alblf.image.medium,
                input_message_content: {
                    message_text: alblf.formattedMessage.text,
                    entities: alblf.formattedMessage.entities
                }
            },
            {
                type: 'article',
                id: 3,
                title: 'Artist:',
                description: `🧑‍🎤 ${limitText(artlf.artist, 15)}\n` +
                    `📈 ${(artlf.userplaycount + 1).toLocaleString('pt-BR')} ${artlf.userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`,
                thumb_url: artlf.image.medium,
                input_message_content: {
                    message_text: artlf.formattedMessage.text,
                    entities: artlf.formattedMessage.entities
                }
            }
        ]

        await ctx.answerInlineQuery(results, { is_personal: true, cache_time: 0 })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default inlineQuery