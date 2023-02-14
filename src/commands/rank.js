import { getWeeklyTrackChart } from "../controllers/lastfm.js"
import { getAllRankGroups } from "../database/rank.js"
import { getLastfmUser } from '../database/user.js'
import errorHandler from "../handlers/errorHandler.js"

const getLastfmData = async (array) => {
    const data = await getWeeklyTrackChart(array.lastfm_user)

    const tracks = data.weeklytrackchart.track
    const length = tracks.length

    const scrobbles = tracks.reduce((accum, curr) => {
        return accum + Number(curr.playcount)
    }, 0)

    return {
        user: {
            lastfm_user: array.lastfm_user,
            first_name: 'teste',
            telegram_id: array.telegram_id
        },
        tracks: length,
        scrobbles
    }
}

const rank = async (ctx) => {

    try {

        const groups = await getAllRankGroups()


        users = await Promise.all(
            users.map(async item => {
                const memberInfo = await ctx.telegram.getChatMember(chat_id, telegram_id)
                const lastfm_user = await getLastfmUser(item.telegram_id)

                return Promise.resolve({
                    telegram_id: item.telegram_id,
                    lastfm_user,
                    first_name: memberInfo.user.first_name
                })
            })
        )

        const result = await Promise.all(users.map(getLastfmData))

        result.sort((a, b) => b.scrobbles - a.scrobbles)

        const text = [
            `🏆Weekly Tracks Chart 🏆\n`,
        ]

        const entities = [
            {
                offset: 0,
                length: text[0].length,
                type: 'bold',
            }
        ]

        const medal = (index) => {
            const medals = ['🥇', '🥈', '🥉', '🏅']
            return medals[index] || medals[3]
        }

        result.reduce((sum, item) => {
            const nameIndex = text.reduce((sumIndex, current) => sumIndex + current.length, 0) + 4

            text.push(
                `\n${medal(sum)} ${item.user.first_name} - ${item.scrobbles} ${item.scrobbles != 1 ? 'scrobbles' : 'scrobble'}`
            )

            entities.push({
                offset: nameIndex,
                length: item.user.first_name.length,
                type: 'text_mention',
                user: {
                    id: item.user.telegram_id,
                    first_name: item.user.first_name
                }
            })

            return sum + 1
        }, 0)

        await ctx.reply(text.join(''), { entities })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default rank