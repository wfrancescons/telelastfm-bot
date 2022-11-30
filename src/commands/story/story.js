import { getLastfmUser } from '../../database/user.js'
import errorHandler from '../../handlers/errorHandler.js'
import checkSendMediaPermission from '../../scripts/checkSendMediaPermission.js'
import {
  acceptedMedias, acceptedPeriods, mediaMap, periodMap
} from './storyMaps.js'
import generateStory from './topFive.js'
import generateVisualizer from './visualizer.js'

const story = async (ctx) => {

  const { first_name, id: telegram_id } = ctx.update.message.from
  const text = ctx.update.message.text.trim().toLowerCase()
  let [command, media_type, period] = text.split(' ')

  try {
    await ctx.replyWithChatAction('typing')

    const canSendPhoto = await checkSendMediaPermission(ctx)
    if (!canSendPhoto) return errorHandler(ctx, 'CANNOT_SEND_MEDIA_MESSAGES')

    const lastfm_user = await getLastfmUser(telegram_id)

    if (acceptedMedias.includes(media_type) && !period) {
      media_type = mediaMap[media_type]
      generateVisualizer(ctx, lastfm_user, first_name, media_type)
        .catch(error => {
          errorHandler(ctx, error)
        })

    } else if (acceptedMedias.includes(media_type) && acceptedPeriods.includes(period)) {
      media_type = mediaMap[media_type]
      period = periodMap[period]
      generateStory(ctx, lastfm_user, first_name, media_type, period)
        .catch(error => {
          errorHandler(ctx, error)
        })

    } else {
      return errorHandler(ctx, 'STORY_INCORRECT_ARGS')
    }

  } catch (error) {
    errorHandler(ctx, error)
  }
}

export default story