import { logCommand } from '../database/services/commandUsageLog.js'
import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { acceptedMedias, acceptedPeriods } from '../helpers/validValuesMap.js'
import { getUserTopAlbums, getUserTopArtists, getUserTopTracks } from '../services/lastfm.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

const DEFAULT_MEDIA_TYPE = 'artists'
const DEFAULT_PERIOD = '7day'

async function getLastfmData(lastfm_user, media_type, period, limit) {
    try {
        if (media_type === 'tracks') {
            const lastfmData = await getUserTopTracks(lastfm_user, period, limit)
            return lastfmData
        }

        if (media_type === 'albums') {
            const lastfmData = await getUserTopAlbums(lastfm_user, period, limit)
            return lastfmData
        }

        if (media_type === 'artists') {
            const lastfmData = await getUserTopArtists(lastfm_user, period, limit)
            return lastfmData
        }
    } catch (error) {
        throw error
    }
}

function parseArgs(args) {
    const grid = args.find(arg => arg.match(GRID_REGEX)) || DEFAULT_GRID
    const media_type = args.find(arg => acceptedMedias.includes(arg)) || DEFAULT_MEDIA_TYPE
    const period = args.find(arg => acceptedPeriods.includes(arg)) || DEFAULT_PERIOD
    const param = args.find(arg => ['notexts', 'noplays'].includes(arg))
    return { grid, media_type, period, param }
}

function validateGrid(grid) {
    const match = grid.match(GRID_REGEX)
    if (!match) throw 'COLLAGE_INCORRECT_ARGS'

    const COLUMNS = Number(match[1])
    const ROWS = Number(match[2])

    if (COLUMNS > MAX_COLUMNS || COLUMNS < MIN_COLUMNS || ROWS > MAX_ROWS || ROWS < MIN_ROWS) {
        throw 'COLLAGE_INCORRECT_ARGS'
    }

    return { COLUMNS, ROWS }
}

async function toplf(ctx) {

    const telegram_id = ctx.message.from.id
    const first_name = ctx.update.message.from.first_name
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')
    const chat_id = ctx.message.chat.id

    logCommand('toplf', telegram_id, chat_id)

    try {
        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const lastfm_user = await getLastfmUser(telegram_id)

        const { grid, media_type, period, param } = parseArgs(args)
        const { COLUMNS, ROWS } = validateGrid(grid)

        const responseExtra = {
            reply_to_message_id: ctx.message?.message_id,
            entities: []
        }

        const examplesCommand = ['/gridlf 4x1 tracks', '/gridlf 5x3 art', '/gridlf 10x10 notext']
        const tipText = '💡 Tip: you can define your grid, type of media or make a collage with no text\n'

        const responseMessage =
            `Generating your ${grid} grid...\n` +
            `\n⏰ It may take a while\n` +
            `\n${tipText}` +
            `\n➡️ Examples:\n` +
            `${examplesCommand.join('\n')}`

        responseExtra.entities.push(createEntity(responseMessage.indexOf(tipText), tipText.length, 'italic'))
        for (const example of examplesCommand) {
            responseExtra.entities.push(createEntity(responseMessage.indexOf(example), example.length, 'code'))
        }

        const response = await sendTextMessage(ctx, responseMessage, responseExtra)

        const lastfmData = await getLastfmData(lastfm_user, mediaMap[media_type], periodMap[period], COLUMNS * ROWS)

        const extra = {
            reply_to_message_id: ctx.message?.message_id,
            caption: `${first_name}, your ${grid} grid`
        }

        ctx.replyWithChatAction('upload_photo').catch(error => console.error(error))

        const templateData = {
            lastfmData,
            columns: COLUMNS,
            rows: ROWS,
            predominantColor: [14, 14, 14],
            media_type: mediaMap[media_type],
            param
        }

        if (param !== 'notexts') {
            const predominantColor = await getPredominantColor(lastfmData[0].image.small)
            templateData.predominantColor = predominantColor
        }

        const template = gridlfTemplate(templateData)

        const canva = await renderCanvas(template)

        await sendPhotoMessage(ctx, { source: canva }, extra)
        await ctx.deleteMessage(response.message_id)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default toplf
