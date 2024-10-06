import { getUserTopAlbums, getUserTopArtists, getUserTopTracks } from '../controllers/lastfm.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMediaMessage, canSendMessage, isChannel, isChannelMsgForward } from '../helpers/chatHelper.js'
import { generateBackground } from '../helpers/colors.js'
import { acceptedMedias, acceptedPeriods, mediaMap, periodInTextMap, periodMap } from '../helpers/validValuesMap.js'
import { htmlToImage } from '../modules/htmlToImage.js'
import generateTopHtml from './templates/topTemplate.js'

function getLastfmData(lastfm_user, media, period) {

    return new Promise((resolve, reject) => {
        if (media === 'tracks') {
            getUserTopTracks(lastfm_user, period)
                .then(data => resolve(data))
                .catch(error => reject(error))
        }

        if (media === 'albums') {
            getUserTopAlbums(lastfm_user, period)
                .then(data => resolve(data))
                .catch(error => reject(error))
        }

        if (media === 'artists') {
            getUserTopArtists(lastfm_user, period)
                .then(data => resolve(data))
                .catch(error => reject(error))
        }

    })
}

function createTemplate(lastfm_user, media_type, period) {
    return new Promise(async (resolve, reject) => {
        try {

            console.time('Fetch Lastfm Data')
            const lastfm_data = await getLastfmData(lastfm_user, media_type, period)
            console.timeEnd('Fetch Lastfm Data')

            console.time('Background Blur')
            const background_buffer = await generateBackground(lastfm_data[0].image)
            console.timeEnd('Background Blur')

            const html = generateTopHtml({
                lastfm_data,
                background_buffer,
                media_type,
                period
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

async function top(ctx) {
    console.time('TOTAL TIME')

    const chat_id = ctx.message.chat.id
    const { first_name, id: telegram_id } = ctx.update.message.from
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')

    try {
        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return
        await ctx.replyWithChatAction('typing')

        let media_type = args.find(arg => acceptedMedias.includes(arg))
        media_type = media_type ? mediaMap[media_type] : undefined

        let period = args.find(arg => acceptedPeriods.includes(arg))
        period = period ? periodMap[period] : undefined

        if ((!media_type || !period) && args.length > 2) return errorHandler(ctx, 'TOP_INCORRECT_ARGS')

        if (!media_type) media_type = 'albums'
        if (!period) period = '7day'

        //verifica a permissão de enviar imagens
        if (!await canSendMediaMessage(chat_id, ctx.botInfo.id)) return errorHandler(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

        const lastfm_user = await getLastfmUser(telegram_id)

        //gera a colagem
        const extras = {}
        if (isChannelMsgForward(ctx)) extras.reply_to_message_id = ctx.message.message_id

        const response = await ctx.reply(
            'Generating your top 🖼️\n' +
            'It may take a while...',
            extras
        )

        await ctx.replyWithChatAction('upload_photo')


        createTemplate(lastfm_user, media_type, period)
            .then(topGenerated => {
                console.time('Screenshot Browser')
                htmlToImage(...topGenerated)
                    .then(img_buffer => {
                        console.timeEnd('Screenshot Browser')
                        extras.caption = `${first_name}, your top ${media_type} of ${periodInTextMap[period]}`
                        console.time('Telegram')
                        ctx.replyWithPhoto({ source: img_buffer }, extras)
                            .finally(() => {
                                console.timeEnd('Telegram')
                                console.timeEnd('TOTAL TIME')
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

export default top