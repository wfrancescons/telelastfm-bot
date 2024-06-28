import { getLastfmUser } from '../database/services/user.js'
import { updateStreaks } from '../database/services/userStreaks.js'
import errorHandler from '../handlers/errorHandler.js'
import { getTrackListeningNow } from '../services/lastfm.js'
import { sendTextMessage } from '../utils/messageSender.js'
import lfFormatter from './formatters/lfFormatter.js'

async function lf(ctx) {

  const telegram_id = ctx.message.from.id
  const first_name = ctx.update.message.from.first_name

  try {

    ctx.replyWithChatAction('typing').catch(error => console.error(error))

    const user = await getLastfmUser(telegram_id)
    if (!user) throw 'USER_NOT_FOUND'

    const user_streaks = await updateStreaks(telegram_id)

    const lastfm_data = await getTrackListeningNow(user)

    const data_to_format = {
      first_name,
      streaks_count: user_streaks.streaks_count,
      ...lastfm_data
    }

    const message = lfFormatter(data_to_format)
    const extras = {
      entities: message.entities,
      reply_to_message_id: ctx.message?.message_id
    }

    await sendTextMessage(ctx, message.text, extras)

  } catch (error) {
    errorHandler(ctx, error)
  }
}

export default lf
