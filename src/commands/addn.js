import { newNick } from '../database/artist.js'
import errorHandler from '../handlers/errorHandler.js'
import { hasBadword } from '../scripts/badwords/filter.js'

const addn = async (ctx) => {

  const telegram_id = ctx.message.from.id
  const chat_id = ctx.message.chat.id
  const text = ctx.update.message.text

  //TODO: add regex
  const [command, artistAndNick] = text.split(' ')
  const [commandAndText, artistNick] = text.split('-')

  try {

    await ctx.replyWithChatAction('typing')

    if (!artistAndNick || !artistNick) return errorHandler(ctx, 'ADDN_INCORRECT_ARGS')
    if (hasBadword(artistNick.trim())) return errorHandler(ctx, 'ADDN_BADWORDS')

    //TODO: add regex
    const artist_nick = artistNick.trim()
    const artist_name = commandAndText
      .replace(command, '')
      .trim()
      .toLowerCase()

    const nick = await newNick(chat_id, {
      artist_name,
      artist_nick,
      added_by: telegram_id,
    })

    if (!nick) return errorHandler(ctx, 'COMMON_ERROR')

    await ctx.reply(`Got it! 📝 \nFrom now on I'll call ${commandAndText.replace(command, '').trim()} as ${artist_nick}`)

  } catch (error) {
    return errorHandler(ctx, error)
  }
}

export default addn
