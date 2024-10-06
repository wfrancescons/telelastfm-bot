import bot from '../bot.js'
import { getAllRankGroups, getUsersByChatId, removeInvalidUsersFromGroup } from '../database/services/rankGroupParticipants.js'

async function verifyMember(chat_id, telegram_id) {
    const validUsersStatus = ['administrator', 'member', 'creator', 'restricted']

    try {
        const member_info = await bot.telegram.getChatMember(chat_id, telegram_id)

        if (validUsersStatus.includes(member_info.status)) {
            return true
        }
        return false

    } catch (error) {
        console.log(`BOT: Error verifying user ${telegram_id}:`, error)
    }
}

export default async function updateGroups() {
    try {
        const groups = await getAllRankGroups()

        for (const chat_id of groups) {
            // Buscar usuários no banco de dados para o grupo atual
            const groupUsers = await getUsersByChatId(chat_id)

            // Verificar membros válidos
            const validUsersSet = new Set()  // Usando Set para melhorar a performance nas comparações

            for (const user of groupUsers) {
                // Iterar sobre o gerador assíncrono para verificar usuários válidos
                if (await verifyMember(chat_id, user)) {
                    validUsersSet.add(user)
                }
            }

            // Remover os usuários que não estão no conjunto de usuários válidos
            await removeInvalidUsersFromGroup(chat_id, Array.from(validUsersSet))
        }
    } catch (error) {
        console.error('Error updating groups:', error)
        throw error
    }
}