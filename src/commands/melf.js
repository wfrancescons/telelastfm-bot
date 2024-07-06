import config from '../config.js'
import { getLastfmUser } from '../database/services/user.js'
import { updateStreaks } from '../database/services/userStreaks.js'
import errorHandler from '../handlers/errorHandler.js'
import { acceptedMedias, mediaMap } from '../helpers/validValuesMap.js'
import { getAlbumInfo, getAlbumListeningNow, getArtistInfo, getArtistListeningNow, getTrackInfo, getTrackListeningNow } from '../services/lastfm.js'
import { sendTextMessage } from '../utils/messageSender.js'
import alblfFormatter from './formatters/alblfFormatter.js'
import artlfFormatter from './formatters/artlfFormatter.js'
import lfFormatter from './formatters/lfFormatter.js'

function isMessageFromThisBot(ctx) {
    const bot_username = config.bot.username.replace('@', '')
    return ctx.update.message?.reply_to_message?.from?.username === bot_username
}

function parseTextFromThisBot(text_splitted, media_type) {
    if (media_type === 'tracks') {
        const track = text_splitted[1].replace('🎶 ', '')
        const album = text_splitted[2].replace('💿 ', '')
        const artist = text_splitted[3].replace('🧑‍🎤 ', '')
        return { track, album, artist }
    }

    if (media_type === 'albums') {
        const album = text_splitted[1].replace('💿 ', '')
        const artist = text_splitted[2].replace('🧑‍🎤 ', '')
        return { album, artist }
    }

    if (media_type === 'artists') {
        const artist = text_splitted[1].replace('🧑‍🎤 ', '')
        return { artist }
    }
}

async function getScrobblesData({ lastfm_user, media_type, track, album, artist }) {
    try {
        if (media_type === 'tracks') {
            const lastfm_data = await getTrackInfo({ track, artist, username: lastfm_user })
            return lastfm_data
        }

        if (media_type === 'albums') {
            const lastfm_data = await getAlbumInfo({ album, artist, username: lastfm_user })
            return lastfm_data
        }

        if (media_type === 'artists') {
            const lastfm_data = await getArtistInfo({ artist, username: lastfm_user })
            return lastfm_data
        }
    } catch (error) {
        throw error
    }
}

async function getLastfmData({ lastfm_user, media_type }) {
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

function formatMessage(data, media_type) {
    if (media_type === 'tracks') {
        const formatted_message = lfFormatter(data)
        return formatted_message
    }

    if (media_type === 'albums') {
        const formatted_message = alblfFormatter(data)
        return formatted_message
    }

    if (media_type === 'artists') {
        const formatted_message = artlfFormatter(data)
        return formatted_message
    }
}

function parseArgs(args) {
    const media_type = args.find(arg => acceptedMedias.includes(arg)) || 'tracks'
    return media_type
}

function detectMediaType(text) {
    if (text.startsWith('🎶')) return 'tracks'
    if (text.startsWith('💿')) return 'albums'
    if (text.startsWith('🧑‍🎤')) return 'artists'
    return null
}

async function melf(ctx) {

    let telegram_id = ctx.message.from.id
    let first_name = ctx.update.message.from.first_name
    let reply_to_message_id = ctx.message.message_id
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')
    let media_type = parseArgs(args)
    media_type = mediaMap[media_type]

    const isReplyToOther = ctx.update.message?.reply_to_message
    const isReplyToChannel = ctx.update.message?.reply_to_message?.sender_chat?.type === 'channel'

    if (!isReplyToOther || isReplyToChannel) return console.log('precisa responder uma mensagem de outro usuário')

    const reply_user_telegram_id = ctx.update.message.reply_to_message.from.id

    try {
        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        if (isMessageFromThisBot(ctx)) {
            const bot_text = ctx.update.message.reply_to_message.text
            if (!bot_text) return console.log('não é uma mensagem de música')

            const text_splitted = bot_text.split('\n')

            const lastfm_user_sender = await getLastfmUser(telegram_id)
            if (!lastfm_user_sender) throw 'USER_NOT_FOUND'

            const media_type = detectMediaType(text_splitted[1])
            if (!media_type) return console.log('não é uma mensagem de música')

            const user_streaks = await updateStreaks(telegram_id)

            const message_infos = parseTextFromThisBot(text_splitted, media_type)
            const lastfm_data = await getScrobblesData({ lastfm_user: lastfm_user_sender, media_type, ...message_infos })

            const data = {
                first_name,
                streaks_count: user_streaks.streaks_count,
                isCustom: true,
                ...lastfm_data
            }

            const formatted_message = formatMessage(data, media_type)
            const extras = {
                entities: formatted_message.entities,
                reply_to_message_id
            }

            await sendTextMessage(ctx, formatted_message.text, extras)
            return
        }

        const sender_lastfm_user = await getLastfmUser(telegram_id)
        if (!sender_lastfm_user) throw 'USER_NOT_FOUND'

        const reply_lastfm_user = await getLastfmUser(reply_user_telegram_id)
        if (!reply_lastfm_user) throw 'USER_NOT_FOUND_REPLY'

        const user_streaks = await updateStreaks(telegram_id)

        const reply_lastfm_data = await getLastfmData({ lastfm_user: reply_lastfm_user, media_type })
        const sender_lastfm_data = await getLastfmData({ lastfm_user: sender_lastfm_user, media_type, ...reply_lastfm_data })

        const data = {
            first_name,
            streaks_count: user_streaks.streaks_count,
            isCustom: true,
            ...sender_lastfm_data
        }

        const formatted_message = formatMessage(data, media_type)
        const extras = {
            entities: formatted_message.entities,
            reply_to_message_id
        }

        await sendTextMessage(ctx, formatted_message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default melf