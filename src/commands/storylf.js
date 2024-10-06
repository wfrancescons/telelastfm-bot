import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { acceptedMedias, mediaMap } from '../helpers/validValuesMap.js'
import renderCanvas from '../rendering/renderCanva.js'
import { getAlbumListeningNow, getArtistListeningNow, getTrackListeningNow } from '../services/lastfm.js'
import createEntity from '../utils/createEntity.js'
import getPredominantColor from '../utils/getPredominatColor.js'
import { sendPhotoMessage, sendTextMessage } from '../utils/messageSender.js'
import storylfTemplate from './templates/storylfTemplate.js'

async function getLastfmData(lastfm_user, media_type) {
    try {
        if (media_type === 'tracks') {
            const lastfm_data = await getTrackListeningNow(lastfm_user)
            return lastfm_data
        }

        if (media_type === 'albums') {
            const lastfm_data = await getAlbumListeningNow(lastfm_user)
            return lastfm_data
        }

        if (media_type === 'artists') {
            const lastfm_data = await getArtistListeningNow(lastfm_user)
            return lastfm_data
        }
    } catch (error) {
        throw error
    }
}

function parseArgs(args) {
    const media_type = args.find(arg => acceptedMedias.includes(arg)) || 'tracks'
    return media_type
}

async function storylf(ctx) {

    const telegram_id = ctx.message.from.id
    const first_name = ctx.update.message.from.first_name
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')
    const media_type = parseArgs(args)

    try {
        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'
        const lastfm_data = await getLastfmData(lastfm_user, mediaMap[media_type])

        const responseExtra = {
            reply_to_message_id: ctx.message?.message_id,
            entities: []
        }

        const examplesCommand = ['/story alb', '/story art']
        const tipText = '💡 Tip: you can define the type of media of your story\n'
        const responseMessage = `Generating your ${media_type} story...\n` +
            `\n${tipText}` +
            `\n➡️ Examples:\n` +
            `${examplesCommand.join('\n')}`

        responseExtra.entities.push(createEntity(responseMessage.indexOf(tipText), tipText.length, 'italic'))

        for (const example of examplesCommand) {
            responseExtra.entities.push(createEntity(responseMessage.indexOf(example), example.length, 'code'))
        }

        const response = await sendTextMessage(ctx, responseMessage, responseExtra)

        const extra = {
            reply_to_message_id: ctx.message?.message_id,
            caption: `${first_name}, your ${media_type} story`
        }

        ctx.replyWithChatAction('upload_photo').catch(error => console.error(error))

        const predominant_color = await getPredominantColor(lastfm_data.image.small)

        const templateData = {
            lastfm_data,
            predominant_color,
            media_type: mediaMap[media_type]
        }

        const template = storylfTemplate(templateData)
        const canva = await renderCanvas(template)

        await sendPhotoMessage(ctx, { source: canva }, extra)
        await ctx.deleteMessage(response.message_id)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default storylf