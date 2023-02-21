import { newNick } from '../database/artist.js'
import { getLastfmUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { canSendMessage, isChannel } from '../helpers/chatHelper.js'
import { hasBadword } from '../modules/badwords/filter.js'

const addn = async (ctx) => {

  const telegram_id = ctx.message.from.id
  const chat_id = ctx.message.chat.id
  const text = ctx.update.message.text

  //TODO: add regex
  const [command, artistAndNick] = text.split(' ')
  const [commandAndText, artistNick] = text.split('-')

  try {

    if (isChannel(ctx) || !await canSendMessage(chat_id, ctx.botInfo.id)) return;

    await ctx.replyWithChatAction('typing')

    if (!artistAndNick || !artistNick) return errorHandler(ctx, 'ADDN_INCORRECT_ARGS')
    if (hasBadword(artistNick.trim())) return errorHandler(ctx, 'ADDN_BADWORDS')

    await getLastfmUser(telegram_id)

    const artist_nick = artistNick.trim()
    const artist_name = commandAndText.replace(command, '').trim()

    const nick = await newNick(chat_id, {
      artist_name: artist_name.toLowerCase(),
      artist_nick,
      added_by: telegram_id,
    })

    if (!nick) return errorHandler(ctx, 'COMMON_ERROR')

    const extra = {
      entities: [
        {
          offset: 33,
          length: artist_name.length,
          type: 'italic',
        },
        {
          offset: 33 + artist_name.length + 4,
          length: artist_nick.length,
          type: 'bold',
        }
      ]
    }

    await ctx.reply(
      `Got it! 📝 \n` +
      `From now on I'll call ${artist_name} as ${artist_nick}`,
      extra
    )

  } catch (error) {
    return errorHandler(ctx, error)
  }
}

export default addn
