import { getLastfmUser } from '../../database/user.js'
import generateStory from './topFive.js'
import replyWithError from '../../scripts/replyWithError.js'
import checkSendMediaPermission from '../../scripts/checkSendMediaPermission.js'
import {
  acceptedMedias,
  mediaMap,
  acceptedPeriods,
  periodMap
} from './storyMaps.js'
import generateVisualizer from './visualizer.js'

const story = async (ctx) => {

  const { first_name } = ctx.update.message.from
  const text = ctx.update.message.text.trim().toLowerCase()
  let [command, media_type, period] = text.split(' ')

  try {
    await ctx.replyWithChatAction('typing')

    const canSendPhoto = await checkSendMediaPermission(ctx)
    if (!canSendPhoto) return replyWithError(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

    const lastfm_user = await getLastfmUser(ctx)

    if (acceptedMedias.includes(media_type) && !period) {
      media_type = mediaMap[media_type]
      return generateVisualizer(ctx, lastfm_user, first_name, media_type).catch(error => {
        if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_LASTFM_USER')
        if (error === 'ZERO_SCROBBLES') return replyWithError(ctx, 'ZERO_SCROBBLES')
        if (error === 'PRIVATE_USER') return replyWithError(ctx, 'PRIVATE_USER')
        console.error(error)
        replyWithError(ctx, 'COMMON_ERROR')
      })

    } else if (acceptedMedias.includes(media_type) && acceptedPeriods.includes(period)) {
      media_type = mediaMap[media_type]
      period = periodMap[period]
      return generateStory(ctx, lastfm_user, first_name, media_type, period).catch(error => {
        if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_LASTFM_USER')
        if (error === 'ZERO_SCROBBLES') return replyWithError(ctx, 'ZERO_SCROBBLES')
        if (error === 'PRIVATE_USER') return replyWithError(ctx, 'PRIVATE_USER')
        console.error(error)
        replyWithError(ctx, 'COMMON_ERROR')
      })

    } else {
      return replyWithError(ctx, 'STORY_INCORRECT_ARGS')
    }

  } catch (error) {
    if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_LASTFM_USER')
    if (error === 'ZERO_SCROBBLES') return replyWithError(ctx, 'ZERO_SCROBBLES')
    if (error === 'PRIVATE_USER') return replyWithError(ctx, 'PRIVATE_USER')
    console.error(error)
    replyWithError(ctx, 'COMMON_ERROR')
  }
}

export default story