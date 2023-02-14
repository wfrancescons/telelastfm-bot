import { setLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMessage, isChannel } from '../helpers/chatHelper.js'

const reg = async (ctx) => {

    const chat_id = ctx.message.chat.id
    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, arg] = text


    try {
        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return;

        await ctx.replyWithChatAction('typing')

        if (!arg) return errorHandler(ctx, 'REG_WITHOUT_ARGS')

        const user = await setLastfmUser(telegram_id, arg)

        const extras = { reply_to_message_id: ctx.message.message_id }
        if (user) await ctx.reply(`'${arg}' set as your Lastfm's username ☑️`, extras)

    } catch (error) {
        errorHandler(ctx, error, arg)
    }
}

export default reg