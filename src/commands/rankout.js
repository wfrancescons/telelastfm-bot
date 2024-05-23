import { deleteUser, getUsers } from '../database/rank.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMessage, isChannel } from '../helpers/chatHelper.js'

const MAX_SPOTS = 20

async function rankout(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id

    let rankGroup
    try {
        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return

        await ctx.replyWithChatAction('typing')

        if (chat_id > 0) return errorHandler(ctx, 'RANK_PERSONAL_CHAT')

        const deletedUser = await deleteUser(chat_id, telegram_id)

        if (!deletedUser) return errorHandler(ctx, 'RANK_USER_NOT_FOUND')

        const rankGroup = await getUsers(chat_id)
        await ctx.reply(
            `OK, you're out of Weekly Chart Race! 🎶🏃‍♂️ \n\n` +
            `Spots left: ${MAX_SPOTS - rankGroup.length} \n` +
            `Use /rankin to join again.`,
            {
                entities: [
                    {
                        offset: 18,
                        length: 18,
                        type: 'bold'
                    }
                ]
            }
        )

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default rankout