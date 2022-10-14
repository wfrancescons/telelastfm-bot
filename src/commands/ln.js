import { getTrackListeningNow } from '../controller/lastfm.js'
import { getLastfmUser } from '../database/user.js'
import { getNick } from '../database/artist.js'
import replyWithError from '../scripts/replyWithError.js'

// Listening now: what track is scrobbling
const ln = async (ctx) => {

  const chat_id = ctx.message.chat.id
  const { first_name } = ctx.update.message.from

  try {

    await ctx.replyWithChatAction('typing')

    const lastfm_user = await getLastfmUser(ctx)

    const {
      track,
      album,
      artist,
      image,
      userplaycount,
      isNowPlaying
    } = await getTrackListeningNow(lastfm_user)

    let artist_nick = ''
    const hasArtistNick = await getNick(chat_id, artist.toLowerCase())
    if (hasArtistNick) artist_nick = hasArtistNick.artists[0].artist_nick

    const text =
      `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
      `\n🎶 ${track}` +
      `\n💿 ${album}` +
      `\n🧑‍🎤 ${artist_nick ? `${artist_nick} (${artist})` : artist} \n` +
      `\n📈 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`

    const entities = [

      {
        offset: text.indexOf(first_name),
        length: first_name.length,
        type: 'bold',
      },
      {
        offset: text.indexOf(track),
        length: track.length,
        type: 'bold',
      },
      {
        offset: text.indexOf('📈'),
        length: '📈'.length,
        type: 'text_link',
        url: image,
      }

    ]

    if (artist_nick)
      entities.push({
        offset: text.indexOf(artist),
        length: artist.length,
        type: 'italic',
      })

    await ctx.reply(text, { entities })

  } catch (error) {

    if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_LASTFM_USER')
    if (error === 'ZERO_SCROBBLES') return replyWithError(ctx, 'ZERO_SCROBBLES')
    console.error(error)
    replyWithError(ctx, 'COMMON_ERROR')

  }
}

export default ln