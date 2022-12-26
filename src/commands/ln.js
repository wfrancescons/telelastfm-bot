import { getTrackListeningNow } from '../controller/lastfm.js'
import { getNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import lnModel from './models/lnModel.js'

// Listening now: what track is scrobbling
const ln = async (ctx) => {

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
      track,
      album,
      artist,
      image,
      userplaycount,
      lovedtrack,
      isNowPlaying
    } = await getTrackListeningNow(lastfm_user)

    let artist_nick = ''
    const hasArtistNick = await getNick(chat_id, artist.toLowerCase())
    if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

    const data = {
      lovedtrack,
      isNowPlaying,
      track,
      album,
      artist,
      userplaycount,
      first_name,
      artist_nick,
      image
    }

    const message = lnModel(data)

    await ctx.reply(message.text, { entities: message.entities })

  } catch (error) {
    errorHandler(ctx, error)
  }
}

export default ln