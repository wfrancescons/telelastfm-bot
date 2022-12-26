import { getAlbumListeningNow } from '../controller/lastfm.js'
import { getNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import albModel from './models/albModel.js'

//Album: what album is scrobbling
const alb = async (ctx) => {

    const chat_id = ctx.message.chat.id
    let { first_name, id: telegram_id } = ctx.update.message.from

    const isReply = ctx.update.message.reply_to_message?.from.id

    if (isReply) {
        first_name = ctx.update.message.reply_to_message.from.first_name
        telegram_id = ctx.update.message.reply_to_message.from.id
    }

    try {

        await ctx.replyWithChatAction('typing')

        const lastfm_user = await getLastfmUser(telegram_id)

        const {
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getAlbumListeningNow(lastfm_user)

        let artist_nick = ''
        const hasArtistNick = await getNick(chat_id, artist.toLowerCase())
        if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

        const data = {
            isNowPlaying,
            album,
            artist,
            userplaycount,
            first_name,
            artist_nick,
            image
        }

        const message = albModel(data)

        await ctx.reply(message.text, { entities: message.entities })

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default alb
