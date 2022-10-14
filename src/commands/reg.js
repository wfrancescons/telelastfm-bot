import { setLastfmUser } from '../database/user.js'
import replyWithError from '../scripts/replyWithError.js'

const reg = async (ctx) => {

    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, arg] = text

    try {

        await ctx.replyWithChatAction('typing')

        if (!arg) return replyWithError(ctx, 'REG_WITHOUT_ARGS')

        const user = await setLastfmUser(telegram_id, arg)

        await ctx.reply(`'${arg}' set as your Lastfm's username ☑️`)

            .then(user => {
                if (!user) return ctx.reply(`'${arg}' doesn't seem to be a valid Lastfm's username 🤔 \nPlease, try again`)
                return
            })
            .catch(erro => {
                console.log(erro)
                return ctx.reply('Something went wrong 🥴 \nBut don\'t fret, let\'s give it another shot in a couple of minutes.')
            })

    } catch (error) {

        if (error === 'USER_NOT_FOUND') return replyWithError(ctx, 'NOT_A_VALID_LASTFM_USER', arg)
        console.log(error)
        replyWithError(ctx, 'COMMON_ERROR')

    }
}

export default reg