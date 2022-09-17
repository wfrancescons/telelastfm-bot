import { getUserTopTracks, getUserTopAlbums, getUserTopArtists } from '../controller/lastfm.js'
import { getLastfmUser } from '../controller/user.js'
import makeStory from './collage/collage.js'
import replyWithError from '../scripts/replyWithError.js'

const acceptedMediaTypes = ['tracks', 'albums', 'artists']
const acceptedPeriods = ['overall', '7day', '1month', '3month', '6month', '12month',]

const periodMap = {
  'overall': 'all time',
  '7day': 'last 7 days',
  '1month': 'last month',
  '3month': 'last 3 months',
  '6month': 'last 6 months',
  '12month': 'last 12 months',
}

const getLastfmData = (lastfm_user, media, period) => {

  return new Promise(async (resolve, reject) => {

    try {

      let data

      if (media === 'tracks') data = await getUserTopTracks(lastfm_user, period)
      if (media === 'albums') data = await getUserTopAlbums(lastfm_user, period)
      if (media === 'artists') data = await getUserTopArtists(lastfm_user, period)

      resolve(data)

    } catch (erro) {

      reject(erro)

    }

  })
}

const story = async (ctx) => {

  const { first_name } = ctx.update.message.from
  const text = ctx.update.message.text.trim().toLowerCase()
  const [command, media_type, period] = text.split(' ')

  try {

    await ctx.replyWithChatAction('typing')

    if (!acceptedMediaTypes.includes(media_type) || !acceptedPeriods.includes(period)) {
      return replyWithError(ctx, 'STORY_INCORRECT_ARGS')
    }

    const lastfm_user = await getLastfmUser(ctx)

    const lastfmData = await getLastfmData(lastfm_user, media_type, period)
    const periodToText = periodMap[period]
    const model = { period: periodToText, mediaType: media_type, data: lastfmData }

    const response = await ctx.reply('🖼️ Generating your collage...')
    const { message_id } = response

    await ctx.replyWithChatAction('upload_photo')

    makeStory(model).then(async (imageBuffer) => {
      await ctx.replyWithPhoto({ source: imageBuffer },
        { caption: `${first_name}, your top ${media_type} of ${periodToText}` })
      await ctx.deleteMessage(message_id)
    })

  } catch (error) {
    if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_LASTFM_USER')
    if (error === 'ZERO_SCROBBLES') return replyWithError(ctx, 'ZERO_SCROBBLES')
    console.error(error)
    replyWithError(ctx, 'COMMON_ERROR')
  }
}

export default story
