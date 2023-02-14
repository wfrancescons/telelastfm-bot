import { getUsers, newUser } from '../database/rank.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMessage, isChannel } from '../helpers/chatHelper.js'

const MAX_SPOTS = 20

const rankin = async (ctx) => {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id

    let rankGroup
    try {

        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return;

        await ctx.replyWithChatAction('typing')

        if (chat_id > 0) return errorHandler(ctx, 'RANK_PERSONAL_CHAT')

        await getLastfmUser(telegram_id)

        rankGroup = await getUsers(chat_id)

        if (rankGroup) {
            const users_length = rankGroup.length
            if (users_length >= MAX_SPOTS) return errorHandler(ctx, 'RANK_NO_VACANCY')
        }

        const user = await newUser(chat_id, telegram_id)

        await ctx.reply(
            `You're in the group Weekly Chart Race! 🏃‍♂️ \n\n` +
            `Spots left: ${MAX_SPOTS - user.users_length}`
        )

    } catch (error) {
        if (error === 'RANK_REGISTERED_USER') return errorHandler(ctx, error, MAX_SPOTS - rankGroup.length)
        return errorHandler(ctx, error)
    }
}

export default rankin
