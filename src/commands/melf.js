import config from '../config.js'
import { getLastfmUser } from '../database/services/user.js'
import { updateStreaks } from '../database/services/userStreaks.js'
import errorHandler from '../handlers/errorHandler.js'
import { getTrackInfo, getTrackListeningNow } from '../services/lastfm.js'
import { sendTextMessage } from '../utils/messageSender.js'
import lfFormatter from './formatters/lfFormatter.js'

async function melf(ctx) {

    let telegram_id = ctx.message.from.id
    let first_name = ctx.update.message.from.first_name
    let reply_to_message_id = ctx.message.message_id

    const isReplyToOther = ctx.update.message?.reply_to_message
    const isReplyToChannel = ctx.update.message?.reply_to_message?.sender_chat?.type === 'channel'

    if (!isReplyToOther || isReplyToChannel) return console.log('precisa responder uma mensagem de outro usuário')

    const reply_user_telegram_id = ctx.update.message.reply_to_message.from.id

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const bot_username = config.bot.username.replace('@', '')

        if (ctx.update.message?.reply_to_message?.from?.username === bot_username) {
            const text = ctx.update.message.reply_to_message.text
            const parse_text = text.split('\n')

            if (!parse_text[1].startsWith('🎶 ')) return console.log('não é uma mensagem de música')

            const track = parse_text[1].replace('🎶 ', '')
            const artist = parse_text[3].replace('🧑‍🎤 ', '')

            const lastfm_user_sender = await getLastfmUser(telegram_id)
            if (!lastfm_user_sender) throw 'USER_NOT_FOUND'

            const user_streaks = await updateStreaks(telegram_id)

            const lastfm_data2 = await getTrackInfo({ track, artist, username: lastfm_user_sender })

            const data = {
                first_name,
                streaks_count: user_streaks.streaks_count,
                isCustom: true,
                ...lastfm_data2
            }

            const message = lfFormatter(data)
            const extras = {
                entities: message.entities,
                reply_to_message_id
            }

            await sendTextMessage(ctx, message.text, extras)
            return
        }

        const lastfm_user_sender = await getLastfmUser(telegram_id)
        if (!lastfm_user_sender) throw 'USER_NOT_FOUND'

        const lastfm_user_reply = await getLastfmUser(reply_user_telegram_id)
        if (!lastfm_user_reply) throw 'USER_NOT_FOUND_REPLY'

        const user_streaks = await updateStreaks(telegram_id)

        const lastfm_data1 = await getTrackListeningNow(lastfm_user_reply)

        const track = lastfm_data1.track || ''
        const artist = lastfm_data1.artist || ''

        const lastfm_data2 = await getTrackInfo({ track, artist, username: lastfm_user_sender })

        const data = {
            first_name,
            streaks_count: user_streaks.streaks_count,
            isCustom: true,
            ...lastfm_data2
        }

        const message = lfFormatter(data)
        const extras = {
            entities: message.entities,
            reply_to_message_id
        }

        await sendTextMessage(ctx, message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default melf