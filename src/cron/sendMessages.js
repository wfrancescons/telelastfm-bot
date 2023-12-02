import bot from '../bot.js'
import { getAllRankGroups, getUsers } from '../database/rank.js'
import { getUsersScrobbles } from '../database/user.js'
import { canSendMessage } from '../helpers/chatHelper.js'

const MAX_SPOTS = 20

export default async () => {
    return new Promise(async (resolve, reject) => {
        try {

            const groups = await getAllRankGroups()

            const { id: bot_id } = await bot.telegram.getMe()

            await Promise.all(groups.map(async group => {

                if (!await canSendMessage(group.chat_id, bot_id)) Promise.resolve()

                const users_scrobbles_infos = await getUsersScrobbles(group.users.map(user => user.telegram_id))

                const result = await Promise.all(users_scrobbles_infos.map(async item => {
                    const member_info = await bot.telegram.getChatMember(group.chat_id, item.telegram_id)
                    const member_name = member_info.user.first_name

                    item.first_name = member_name

                    return item
                }))

                result.sort((a, b) => b.weekly_scrobbles_playcount.scrobbles - a.weekly_scrobbles_playcount.scrobbles)

                const text = [
                    `🏆 Weekly Tracks Chart 🏆\n`,
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
                        `\n${medal(sum)} ${item.first_name} - ${Number(item.weekly_scrobbles_playcount.scrobbles).toLocaleString('pt-BR')} ${item.weekly_scrobbles_playcount.scrobbles != 1 ? 'scrobbles' : 'scrobble'}`
                    )

                    entities.push({
                        offset: nameIndex,
                        length: item.first_name.length,
                        type: 'text_mention',
                        user: {
                            id: item.telegram_id,
                            first_name: item.first_name
                        }
                    })

                    return sum + 1
                }, 0)

                const rankGroup = await getUsers(group.chat_id)

                if (rankGroup.length < 20) text.push(
                    `\n\nSpots left: ${MAX_SPOTS - rankGroup.length} \n` +
                    `Use /rankin to join the race.`
                )

                await bot.telegram.sendMessage(group.chat_id, text.join(''), { entities })
            }))
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}