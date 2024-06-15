import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { getAlbumInfo, getAlbumListeningNow } from '../services/lastfm.js'
import { sendTextMessage } from '../utils/messageSender.js'
import alblfFormatter from './formatters/alblfFormatter.js'

function parseCustomData(custom_data) {
    const array = custom_data.split('-')

    if (array.length !== 2) throw 'CUSTOM_ALBUM_NOT_FOUND'
    for (const item of array) {
        if (item === '') throw 'CUSTOM_ALBUM_NOT_FOUND'
    }

    const custom_album = array[0].trim()
    const custom_artist = array[1].trim()

    return { custom_album, custom_artist }
}

async function alblf(ctx) {

    const telegram_id = ctx.message.from.id
    const first_name = ctx.update.message.from.first_name
    const hasArgs = ctx.args.length > 0

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        let lastfm_data
        if (hasArgs) {
            const custom_data = parseCustomData(ctx.args.join(' '))
            lastfm_data = await getAlbumInfo({ album: custom_data.custom_album, artist: custom_data.custom_artist, username: lastfm_user })
        } else {
            lastfm_data = await getAlbumListeningNow(lastfm_user)
        }

        const data = {
            first_name,
            ...lastfm_data
        }

        if (hasArgs) data.isCustom = true

        const message = alblfFormatter(data)
        const extras = {
            entities: message.entities,
            reply_to_message_id: ctx.message?.message_id
        }

        await sendTextMessage(ctx, message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default alblf