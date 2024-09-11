import { findOrCreateRecord, getRecordsCountByChatId } from '../database/services/rankGroupParticipants.js'
import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

const MAX_SPOTS = 50

async function rankinlf(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        if (chat_id > 0) return errorHandler(ctx, 'RANK_PERSONAL_CHAT')

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        const participants_count = await getRecordsCountByChatId(chat_id)
        if (participants_count >= MAX_SPOTS) return errorHandler(ctx, 'RANK_NO_VACANCY')

        const new_record = await findOrCreateRecord(chat_id, telegram_id)

        const extras = {
            reply_to_message_id: ctx.message.message_id,
            entities: []
        }

        const message = `You're in the group Weekly Chart Race! 🎶🏃‍♂️ \n\n` +
            `Spots left: ${MAX_SPOTS - participants_count - 1}`

        extras.entities.push(createEntity(20, 18, 'bold'))

        await sendTextMessage(ctx, message, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default rankinlf
