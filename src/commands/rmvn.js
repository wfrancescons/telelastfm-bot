import { deleteNick } from '../database/artist.js'
import replyWithError from '../scripts/replyWithError.js'

const rmvn = async (ctx) => {

    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text

    const [command] = text.split(' ')
    const artist_nick = text.replace(command, '').trim().toLowerCase()

    try {

        await ctx.replyWithChatAction('typing')

        if (!artist_nick) return replyWithError(ctx, 'RMVN_WITHOUT_ARGS')

        const deletedNick = await deleteNick(chat_id, artist_nick)

        if (!deletedNick) return replyWithError(ctx, 'RMVN_NICK_NOT_FOUND')

        await ctx.reply(`OK! 📝 \nArtist's nick removed 🙂`)

    } catch (error) {

        console.log(error)
        return replyWithError(ctx, 'COMMON_ERROR')

    }

}

export default rmvn