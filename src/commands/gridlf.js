import { logCommand } from '../database/services/commandUsageLog.js'
import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { acceptedMedias, acceptedPeriods, mediaMap, periodMap } from '../helpers/validValuesMap.js'
import renderCanvas from '../rendering/renderCanva.js'
import { getArtistImageUrl, getTrackImageUrl, getUserTopAlbums, getUserTopArtists, getUserTopTracks } from '../services/lastfm.js'
import { findCachedImage, saveImageToCache } from '../utils/cache.js'
import createEntity from '../utils/createEntity.js'
import getPredominantColor from '../utils/getPredominatColor.js'
import { sendPhotoMessage, sendTextMessage } from '../utils/messageSender.js'
import gridlfTemplate from './templates/gridlfTemplate.js'

const MAX_ROWS = 10
const MIN_ROWS = 1
const MAX_COLUMNS = 10
const MIN_COLUMNS = 1
const DEFAULT_GRID = '4x4'
const DEFAULT_MEDIA_TYPE = 'albums'
const DEFAULT_PERIOD = '7day'
const GRID_REGEX = /^(\d+)x(\d+)$/

async function getLastfmData(lastfm_user, media_type, period, limit) {
    try {
        if (media_type === 'tracks') {
            const lastfm_data = await getUserTopTracks(lastfm_user, period, limit)

            for (const scrobble of lastfm_data) {
                const lastfm_info = {
                    track: scrobble.track.name,
                    artist: scrobble.track.artist
                }

                let cached_image = await findCachedImage(mediaMap[media_type], { ...lastfm_info })

                if (!cached_image) {
                    const track_image_url = await getTrackImageUrl({ ...lastfm_info, username: lastfm_user })
                    cached_image = await saveImageToCache(mediaMap[media_type], track_image_url, lastfm_info)
                }

                scrobble.image = cached_image
            }

            return lastfm_data
        }

        if (media_type === 'albums') {
            const lastfm_data = await getUserTopAlbums(lastfm_user, period, limit)

            for (const scrobble of lastfm_data) {
                const lastfm_info = {
                    album: scrobble.album.name,
                    artist: scrobble.album.artist
                }

                let cached_image = await findCachedImage(mediaMap[media_type], { ...lastfm_info })

                if (!cached_image) {
                    cached_image = await saveImageToCache(mediaMap[media_type], scrobble.image.large, lastfm_info)
                }

                scrobble.image = cached_image
            }

            return lastfm_data
        }

        if (media_type === 'artists') {
            const lastfm_data = await getUserTopArtists(lastfm_user, period, limit)

            for (const scrobble of lastfm_data) {
                const lastfm_info = {
                    artist: scrobble.artist.name
                }

                let cached_image = await findCachedImage(mediaMap[media_type], { ...lastfm_info })

                if (!cached_image) {
                    const artist_image_url = await getArtistImageUrl({ ...lastfm_info, username: lastfm_user })
                    cached_image = await saveImageToCache(mediaMap[media_type], artist_image_url, lastfm_info)
                }

                scrobble.image = cached_image
            }

            return lastfm_data
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
    if (!match) throw 'GRID_INCORRECT_ARGS'

    const COLUMNS = Number(match[1])
    const ROWS = Number(match[2])

    if (COLUMNS > MAX_COLUMNS || COLUMNS < MIN_COLUMNS || ROWS > MAX_ROWS || ROWS < MIN_ROWS) {
        throw 'GRID_INCORRECT_ARGS'
    }

    return { COLUMNS, ROWS }
}

async function gridlf(ctx) {

    const telegram_id = ctx.message.from.id
    const first_name = ctx.update.message.from.first_name
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')
    const chat_id = ctx.message.chat.id

    logCommand('gridlf', telegram_id, chat_id)

    try {
        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        const { grid, media_type, period, param } = parseArgs(args)
        const { COLUMNS, ROWS } = validateGrid(grid)

        const responseExtra = {
            reply_to_message_id: ctx.message?.message_id,
            entities: []
        }

        const examplesCommand = ['/gridlf 4x1 tracks', '/gridlf 5x3 art', '/gridlf 10x10 notexts']
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

        const lastfm_data = await getLastfmData(lastfm_user, mediaMap[media_type], periodMap[period], COLUMNS * ROWS)

        const extra = {
            reply_to_message_id: ctx.message?.message_id,
            caption: `${first_name}, your ${grid} ${mediaMap[media_type]} grid`
        }

        ctx.replyWithChatAction('upload_photo').catch(error => console.error(error))

        const templateData = {
            lastfm_data,
            columns: COLUMNS,
            rows: ROWS,
            predominantColor: [14, 14, 14],
            media_type: mediaMap[media_type],
            param
        }

        if (param !== 'notexts') {
            const predominantColor = await getPredominantColor(lastfm_data[0].image)
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

export default gridlf