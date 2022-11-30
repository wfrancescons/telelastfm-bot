import { setLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'

const reg = async (ctx) => {

    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, arg] = text

    try {

        await ctx.replyWithChatAction('typing')

        if (!arg) return errorHandler(ctx, 'REG_WITHOUT_ARGS')

        const user = await setLastfmUser(telegram_id, arg)

        if (user) await ctx.reply(`'${arg}' set as your Lastfm's username ☑️`)

    } catch (error) {
        errorHandler(ctx, error, arg)
    }
}

export default reg