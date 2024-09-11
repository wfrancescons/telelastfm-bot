import bot from '../bot.js'
import { getAllRankGroups, getRecordsCountByChatId, getUsersByChatId } from '../database/services/rankGroupParticipants.js'
import { getUserScrobblesPlaycount } from '../database/services/weeklyScrobblesPlaycount.js'
import { canSendMessage } from '../helpers/chatHelper.js'

const MAX_SPOTS = 50

export default async function () {
    try {
        const groups = await getAllRankGroups() // array com os ids dos grupos [-12345, -698745,...]

        const { id: bot_id } = await bot.telegram.getMe()

        for (const chat_id of groups) {
            if (!await canSendMessage(chat_id, bot_id)) continue

            const users = await getUsersByChatId(chat_id) // array com os ids dos usuários [1234, 5647, ...]

            const result = []
            for (const telegram_id of users) {

                const member_info = await bot.telegram.getChatMember(chat_id, telegram_id)
                const member_name = member_info.user.first_name
                const member_scrobbles_info = await getUserScrobblesPlaycount(telegram_id)

                const user = {
                    telegram_id,
                    first_name: member_name,
                    scrobbles_playcount: member_scrobbles_info.scrobbles_playcount
                }

                result.push(user)
            }

            result.sort((a, b) => b.scrobbles_playcount - a.scrobbles_playcount)

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
                    `\n${medal(sum)} ${item.first_name} - ${Number(item.scrobbles_playcount).toLocaleString('pt-BR')} ${item.scrobbles_playcount != 1 ? 'scrobbles' : 'scrobble'}`
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

            const rankGroup = await getRecordsCountByChatId(chat_id)

            if (rankGroup.length < 20) text.push(
                `\n\nSpots left: ${MAX_SPOTS - rankGroup.length} \n` +
                `Use /rankin to join the race.`
            )

            await bot.telegram.sendMessage(chat_id, text.join(''), { entities })

        }
    } catch (error) {
        console.error(error)
    }
}