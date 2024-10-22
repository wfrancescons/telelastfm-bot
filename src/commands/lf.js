import { logCommand } from '../database/services/commandUsageLog.js'
import { getLastfmUser } from '../database/services/user.js'
import { updateStreaks } from '../database/services/userStreaks.js'
import errorHandler from '../handlers/errorHandler.js'
import { getTrackListeningNow } from '../services/lastfm.js'
import { sendTextMessage } from '../utils/messageSender.js'
import lfFormatter from './formatters/lfFormatter.js'

async function lf(ctx) {

  let telegram_id = ctx.message.from.id
  let first_name = ctx.update.message.from.first_name
  let reply_to_message_id = ctx.message.message_id
  const chat_id = ctx.message.chat.id

  logCommand('lf', telegram_id, chat_id)

  const isReplyToOther = ctx.update.message?.reply_to_message
  const isReplyToChannel = ctx.update.message?.reply_to_message?.sender_chat?.type === 'channel'

  if (isReplyToOther && !isReplyToChannel) {
    telegram_id = ctx.update.message.reply_to_message.from.id
    first_name = ctx.update.message.reply_to_message.from.first_name
    reply_to_message_id = ctx.update.message.reply_to_message.message_id
  }

  try {

    ctx.replyWithChatAction('typing').catch(error => console.error(error))

    const lastfm_user = await getLastfmUser(telegram_id)
    if (!lastfm_user) throw 'USER_NOT_FOUND'

    const user_streaks = await updateStreaks(telegram_id)

    const lastfm_data = await getTrackListeningNow(lastfm_user)

    const data_to_format = {
      first_name,
      streaks_count: user_streaks.streaks_count,
      ...lastfm_data
    }

    const message = lfFormatter(data_to_format)
    const extras = {
      entities: message.entities,
      reply_to_message_id
    }

    await sendTextMessage(ctx, message.text, extras)

  } catch (error) {
    errorHandler(ctx, error)
  }
}

export default lf
