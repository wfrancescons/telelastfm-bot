import { getAlbumListeningNow, getArtistListeningNow, getTrackListeningNow } from '../controller/lastfm.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMediaMessage, canSendMessage, isChannel, isChannelMsgForward } from '../helpers/chatHelper.js'
import { generateBackground } from '../helpers/colors.js'
import { acceptedMedias, mediaMap } from '../helpers/validValuesMap.js'
import { htmlToImage } from '../scripts/htmlToImage.js'
import generateStoryHtml from './templates/storyTemplate.js'

const getLastfmData = (lastfm_user, media_type) => {
    return new Promise((resolve, reject) => {
        if (media_type === 'tracks') {
            getTrackListeningNow(lastfm_user)
                .then(data => {
                    const { track, album, artist, image, userplaycount } = data
                    resolve({ image, userplaycount, text: [track, album, artist] })
                })
                .catch(error => reject(error))
        }

        if (media_type === 'albums') {
            getAlbumListeningNow(lastfm_user)
                .then(data => {
                    const { album, artist, image, userplaycount } = data
                    resolve({ image, userplaycount, text: [album, artist] })
                })
                .catch(error => reject(error))
        }

        if (media_type === 'artists') {
            getArtistListeningNow(lastfm_user)
                .then(data => {
                    const { artist, image, userplaycount } = data
                    resolve({ image, userplaycount, text: [artist] })
                })
                .catch(error => reject(error))
        }

    })
}

const createTemplate = (lastfm_user, media_type, period) => {
    return new Promise(async (resolve, reject) => {
        try {

            const lastfm_data = await getLastfmData(lastfm_user, media_type)
            const background_buffer = await generateBackground(lastfm_data.image)

            const html = generateStoryHtml({
                lastfm_data,
                background_buffer
            })

            const ssOptions = {
                type: 'jpeg',
                quality: 100,
                fullPage: false,
                clip: { x: 0, y: 0, width: 1080, height: 1920 },
                path: ''
            }

            resolve([html, ssOptions])

        } catch (error) {
            reject(error)
        }
    })
}

const story = async (ctx) => {

    const chat_id = ctx.message.chat.id
    const { first_name, id: telegram_id } = ctx.update.message.from
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')

    try {
        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return;
        await ctx.replyWithChatAction('typing')

        let media_type = args.find(arg => acceptedMedias.includes(arg))
        media_type = media_type ? mediaMap[media_type] : undefined

        if (!media_type && args.length > 1) return errorHandler(ctx, 'STORY_INCORRECT_ARGS')

        if (!media_type) media_type = 'tracks'

        //verifica a permissão de enviar imagens
        if (!await canSendMediaMessage(chat_id, ctx.botInfo.id)) return errorHandler(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

        const lastfm_user = await getLastfmUser(telegram_id)

        //gera a colagem
        const extras = {}
        if (isChannelMsgForward(ctx)) extras.reply_to_message_id = ctx.message.message_id

        const response = await ctx.reply(
            'Generating your story 🖼️\n' +
            'It may take a while...',
            extras
        )

        await ctx.replyWithChatAction('upload_photo')

        createTemplate(lastfm_user, media_type)
            .then(storyGenerated => {
                htmlToImage(...storyGenerated)
                    .then(img_buffer => {
                        extras.caption = `${first_name}, your latest scrobble`
                        ctx.replyWithPhoto({ source: img_buffer }, extras)
                            .finally(() => {
                                ctx.deleteMessage(response.message_id)
                            })
                    })
                    .catch(error => errorHandler(ctx, error))
            })
            .catch(error => errorHandler(ctx, error))

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default story