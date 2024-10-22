import { logCommand } from '../database/services/commandUsageLog.js'
import { findOrCreateRecord } from '../database/services/rankGroupParticipants.js'
import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

async function rankinlf(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id

    logCommand('rankinlf', telegram_id, chat_id)

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        if (chat_id > 0) return errorHandler(ctx, 'RANK_PERSONAL_CHAT')

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        const new_record = await findOrCreateRecord(chat_id, telegram_id)

        if (!new_record) throw 'COMMON_ERROR'

        const extras = {
            reply_to_message_id: ctx.message.message_id,
            entities: []
        }

        const message = `You're in the group Weekly Chart Race! 🎶🏃‍♂️`

        extras.entities.push(createEntity(20, 18, 'bold'))

        await sendTextMessage(ctx, message, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default rankinlf
