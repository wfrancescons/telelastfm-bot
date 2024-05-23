import { getAlbumListeningNow } from '../controllers/lastfm.js'
import { getNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { isChannel, isChannelMsgForward, isReplyToMsg } from '../helpers/chatHelper.js'
import albModel from './models/albModel.js'

//Album: what album is scrobbling
async function alb(ctx) {

    const chat_id = ctx.message.chat.id
    let { first_name, id: telegram_id } = ctx.update.message.from

    let msgToReplyId
    if (isReplyToMsg(ctx) && !isChannelMsgForward(ctx)) {
        first_name = ctx.update.message.reply_to_message.from.first_name
        telegram_id = ctx.update.message.reply_to_message.from.id
        msgToReplyId = ctx.update.message.reply_to_message.message_id
    }

    try {

        if (isChannel(ctx)) return

        await ctx.replyWithChatAction('typing')

        const lastfm_user = await getLastfmUser(telegram_id)

        const {
            album, artist, image, userplaycount, isNowPlaying
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
        const extras = {
            entities: message.entities
        }

        if (isReplyToMsg(ctx)) extras.reply_to_message_id = msgToReplyId
        if (isChannelMsgForward(ctx)) extras.reply_to_message_id = ctx.message.message_id

        ctx.reply(message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }

}

export default alb
