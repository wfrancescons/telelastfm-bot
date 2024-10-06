import { deleteRecord } from '../database/services/rankGroupParticipants.js'
import { getLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

async function rankoutlf(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        if (chat_id > 0) return errorHandler(ctx, 'RANK_PERSONAL_CHAT')

        const lastfm_user = await getLastfmUser(telegram_id)
        if (!lastfm_user) throw 'USER_NOT_FOUND'

        const deletedUser = await deleteRecord(chat_id, telegram_id)
        if (!deletedUser) return errorHandler(ctx, 'RANK_USER_NOT_FOUND')

        const extras = {
            reply_to_message_id: ctx.message.message_id,
            entities: []
        }

        const message = `OK, you're out of Weekly Chart Race! 🎶🏃‍♂️ \n\n` +
            `Use /rankinlf to join again.`

        extras.entities.push(createEntity(18, 18, 'bold'))

        await sendTextMessage(ctx, message, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default rankoutlf