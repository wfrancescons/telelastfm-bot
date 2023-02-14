import { getUserTopAlbums } from '../controllers/lastfm.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMediaMessage, canSendMessage, isChannel, isChannelMsgForward } from '../helpers/chatHelper.js'
import { getCollageColor } from '../helpers/colors.js'
import { acceptedPeriods, periodInTextMap, periodMap } from '../helpers/validValuesMap.js'
import { htmlToImage } from '../scripts/htmlToImage.js'
import generateCollageHtml from './templates/collageTemplate.js'

const createTemplate = (lastfm_user, COLUMNS, ROWS, media_type = 'albums', period) => {
    return new Promise(async (resolve, reject) => {
        try {

            const MAX_SUBARRAY_SIZE = COLUMNS
            const MIN_CELL_SIZE = COLUMNS > ROWS ? (1000 / COLUMNS) : (1000 / ROWS)
            const BODY_WIDTH = Math.round(MIN_CELL_SIZE * COLUMNS)
            const BODY_HEIGHT = Math.round(MIN_CELL_SIZE * ROWS)
            const color = getCollageColor()

            const lastfm_data = await getUserTopAlbums(lastfm_user, period, COLUMNS * ROWS)

            const html = generateCollageHtml({
                COLUMNS,
                ROWS,
                MAX_SUBARRAY_SIZE,
                MIN_CELL_SIZE,
                BODY_WIDTH,
                BODY_HEIGHT,

                lastfm_data,
                color
            })

            const ssOptions = {
                type: 'jpeg',
                quality: 100,
                fullPage: false,
                clip: { x: 0, y: 0, width: BODY_WIDTH, height: BODY_HEIGHT },
                path: ''
            }

            resolve([html, ssOptions])

        } catch (error) {
            reject(error)
        }
    })
}

const collage = async (ctx) => {

    const chat_id = ctx.message.chat.id
    const { first_name, id: telegram_id } = ctx.update.message.from
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')

    try {
        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return;
        await ctx.replyWithChatAction('typing')

        const grid_regex = /^(\d+)x(\d+)$/

        let grid = args.find(arg => arg.match(grid_regex))
        let period = args.find(arg => acceptedPeriods.includes(arg))
        period = period ? periodMap[period] : undefined

        if ((!grid || !period) && args.length > 2) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        if (!grid) grid = '4x4'
        if (!period) period = '7d'

        //verifica se 'grid' e 'period' são válidos
        const regex_result = grid.match(grid_regex)

        if (!regex_result) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        const COLUMNS = Number(regex_result[1])
        const ROWS = Number(regex_result[2])

        if ((COLUMNS > 10 || COLUMNS < 1) || (ROWS > 10 || ROWS < 1)) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        if (!acceptedPeriods.includes(period)) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        //verifica a permissão de enviar imagens
        if (!await canSendMediaMessage(chat_id, ctx.botInfo.id)) return errorHandler(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

        const lastfm_user = await getLastfmUser(telegram_id)

        //gera a colagem
        const extras = {}
        if (isChannelMsgForward(ctx)) extras.reply_to_message_id = ctx.message.message_id

        const response = await ctx.reply(
            'Generating your collage 🖼️\n' +
            'It may take a while...',
            extras
        )

        await ctx.replyWithChatAction('upload_photo')

        period = periodMap[period]
        const collageGenerated = await createTemplate(lastfm_user, COLUMNS, ROWS, 'album', period)

        htmlToImage(...collageGenerated)
            .then(img_buffer => {
                extras.caption = `${first_name}, your ${grid} ${'album'} collage of ${periodInTextMap[period]}`
                ctx.replyWithPhoto({ source: img_buffer }, extras)
                    .finally(() => {
                        ctx.deleteMessage(response.message_id)
                    })
            })
            .catch(error => errorHandler(ctx, error))

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default collage