import { getWeeklyTrackChart } from "../controller/lastfm.js"
import { getLastfmUser } from '../database/user.js'
import errorHandler from "../handlers/errorHandler.js"

const rank = async (ctx) => {

    const chat_id = ctx.message.chat.id
    let { first_name, id: telegram_id } = ctx.update.message.from

    try {

        await ctx.replyWithChatAction('typing')

        const lastfm_user = await getLastfmUser(telegram_id)

        const data = await getWeeklyTrackChart(lastfm_user)

        const tracks = data.weeklytrackchart.track
        const length = tracks.length

        const scrobbles = tracks.reduce((accum, curr) => {
            return accum + Number(curr.playcount)
        }, 0)

        const result = {
            user: {
                lastfm_user,
                first_name,
                telegram_id
            },
            tracks: length,
            scrobbles
        }

        await ctx.reply(
            '🏆Weekly Tracks Chart 🏆\n\n' +

            `🥇 ${first_name} - ${result.scrobbles} ${result.scrobbles + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        )

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default rank