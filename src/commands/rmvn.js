import { deleteNick } from '../database/artist.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMessage, isChannel } from '../helpers/chatHelper.js'

async function rmvn(ctx) {

    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text

    const [command] = text.split(' ')
    const artist_nick = text.replace(command, '').trim().toLowerCase()

    try {
        if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return

        await ctx.replyWithChatAction('typing')

        if (!artist_nick) return errorHandler(ctx, 'RMVN_WITHOUT_ARGS')

        const deletedNick = await deleteNick(chat_id, artist_nick)

        if (!deletedNick) return errorHandler(ctx, 'RMVN_NICK_NOT_FOUND')

        await ctx.reply(`OK! 📝 \nArtist's nick removed 🙂`)

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default rmvn