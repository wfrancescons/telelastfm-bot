import { newNick } from '../controller/artist.js'
import replyWithError from '../scripts/replyWithError.js'

const addn = async (ctx) => {

  const telegram_id = ctx.message.from.id
  const chat_id = ctx.message.chat.id
  const text = ctx.update.message.text

  //TODO: add regex
  const [command, artistAndNick] = text.split(' ')
  const [commandAndText, artistNick] = text.split('-')

  try {

    await ctx.replyWithChatAction('typing')

    if (!artistAndNick || !artistNick) return replyWithError(ctx, 'ADDN_INCORRECT_ARGS')

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

    if (!nick) return replyWithError(ctx, 'COMMON_ERROR')

    await ctx.reply(`Got it! 📝 \nFrom now on I'll call ${commandAndText.replace(command, '').trim()} as ${artist_nick}`)

  } catch (error) {

    console.log(error)
    return replyWithError(ctx, 'COMMON_ERROR')

  }
}

export default addn
