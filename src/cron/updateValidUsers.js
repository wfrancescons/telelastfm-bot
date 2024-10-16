import bot from '../bot.js'
import { getAllRankGroups, getUsersByChatId, removeInvalidUsersFromGroup } from '../database/services/rankGroupParticipants.js'

async function verifyMember(chat_id, telegram_id) {
    const validUsersStatus = ['administrator', 'member', 'creator', 'restricted']

    try {
        const member_info = await bot.telegram.getChatMember(chat_id, telegram_id)

        return validUsersStatus.includes(member_info.status)

    } catch (error) {
        console.log(`BOT: Error verifying user ${telegram_id}:`, error)
    }
}

export default async function updateGroups() {
    try {
        const groups = await getAllRankGroups()

        for (const chat_id of groups) {

            const group_users = await getUsersByChatId(chat_id)
            const valid_users = []

            for (const user of group_users) {
                const isValidMember = await verifyMember(chat_id, user)
                if (isValidMember) {
                    valid_users.push(user)
                }
            }

            await removeInvalidUsersFromGroup(chat_id, valid_users)
        }
    } catch (error) {
        console.error('Error updating groups:', error)
        throw error
    }
}