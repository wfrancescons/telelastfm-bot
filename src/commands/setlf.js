import config from '../config.js'
import { logCommand } from '../database/services/commandUsageLog.js'
import { setLastfmUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

async function setlf(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text.split(' ')
    const [command, lastfm_user] = text

    logCommand('setlf', telegram_id, chat_id)

    try {
        await ctx.replyWithChatAction('typing')

        if (!lastfm_user) return errorHandler(ctx, 'REG_WITHOUT_ARGS')

        const user = await setLastfmUser(telegram_id, lastfm_user)

        if (user) {
            const extras = {
                reply_to_message_id: ctx.message.message_id,
                entities: []
            }

            const message = `${lastfm_user} set as your Lastfm username ✅` +
                `\n\n➡️ Access ${config.bot.news_channel} for news and server status\n` +
                `\nBy using this bot, you agree to our Terms of Use and Privacy Policy available at /privacy`

            extras.entities.push(createEntity(message.indexOf(lastfm_user), lastfm_user.length, 'bold'))

            await sendTextMessage(ctx, message, extras)
        }

    } catch (error) {
        errorHandler(ctx, error, lastfm_user)
    }
}

export default setlf