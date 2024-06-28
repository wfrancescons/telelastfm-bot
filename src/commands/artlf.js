import { getLastfmUser } from '../database/services/user.js'
import { updateStreaks } from '../database/services/userStreaks.js'
import errorHandler from '../handlers/errorHandler.js'
import { getArtistInfo, getArtistListeningNow } from '../services/lastfm.js'
import { sendTextMessage } from '../utils/messageSender.js'
import artlfFormatter from './formatters/artlfFormatter.js'

async function artlf(ctx) {

    const telegram_id = ctx.message.from.id
    const first_name = ctx.update.message.from.first_name
    const hasArgs = ctx.args.length > 0

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        const user_streaks = await updateStreaks(telegram_id)

        let lastfm_data

        if (hasArgs) {
            const custom_data = ctx.args.join(' ')
            lastfm_data = await getArtistInfo({ artist: custom_data, username: lastfm_user })
        } else {
            lastfm_data = await getArtistListeningNow(lastfm_user)
        }

        const data = {
            first_name,
            streaks_count: user_streaks.streaks_count,
            ...lastfm_data
        }

        if (hasArgs) data.isCustom = true

        const message = artlfFormatter(data)
        const extras = {
            entities: message.entities,
            reply_to_message_id: ctx.message?.message_id
        }

        await sendTextMessage(ctx, message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default artlf
