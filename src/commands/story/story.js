import { getUserTopTracks, getUserTopAlbums, getUserTopArtists } from '../../controller/lastfm.js'
import { getLastfmUser } from '../../database/user.js'
import makeStory from './collage.js'
import replyWithError from '../../scripts/replyWithError.js'
import checkSendMediaPermission from '../../scripts/checkSendMediaPermission.js'
import {
  acceptedMedias,
  mediaMap,
  acceptedPeriods,
  periodMap,
  periodInTextMap
} from './storyMaps.js'

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
  let [command, media_type, period] = text.split(' ')

  try {

    await ctx.replyWithChatAction('typing')

    if (!acceptedMedias.includes(media_type) || !acceptedPeriods.includes(period)) {
      return replyWithError(ctx, 'STORY_INCORRECT_ARGS')
    }

    const canSendPhoto = await checkSendMediaPermission(ctx)
    if (!canSendPhoto) return replyWithError(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

    const lastfm_user = await getLastfmUser(ctx)

    media_type = mediaMap[media_type]
    period = periodMap[period]

    const lastfmData = await getLastfmData(lastfm_user, media_type, period)
    const model = { period: periodInTextMap[period], mediaType: media_type, data: lastfmData }

    const response = await ctx.reply('🖼️ Generating your collage...')
    const { message_id } = response

    await ctx.replyWithChatAction('upload_photo')

    makeStory(model).then(async (imageBuffer) => {
      await ctx.replyWithPhoto({ source: imageBuffer },
        { caption: `${first_name}, your top ${media_type} of ${periodInTextMap[period]}` })
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
