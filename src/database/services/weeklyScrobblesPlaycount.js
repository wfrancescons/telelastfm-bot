import { Models } from '../database.js'

const { WeeklyScrobblesPlaycount } = Models

// Função para obter dados de scrobbles e playcount de um usuário específico
export async function getUserScrobblesPlaycount(telegram_id) {
    try {
        const userPlaycount = await WeeklyScrobblesPlaycount.findByPk(telegram_id)
        return userPlaycount
    } catch (error) {
        console.error(`Error fetching scrobbles playcount for user ${telegram_id}:`, error)
        throw error
    }
}

// Função para atualizar os dados de scrobbles e playcount de um usuário
export async function setUserScrobbles(telegram_id, { scrobbles, tracks }) {
    try {
        const user = await WeeklyScrobblesPlaycount.findByPk(telegram_id)

        if (user) {
            await user.update({
                scrobbles_playcount: scrobbles,
                tracks_playcount: tracks
            })
        } else {
            await WeeklyScrobblesPlaycount.create({
                telegram_id,
                scrobbles_playcount: scrobbles,
                tracks_playcount: tracks
            })
        }

    } catch (error) {
        console.error(`Error updating scrobbles for user ${telegram_id}:`, error)
        throw error
    }
}

// Função para obter os dados de scrobbles para múltiplos usuários
export async function getSpecificUsers(telegram_ids) {
    try {
        const users = await WeeklyScrobblesPlaycount.findAll({
            where: {
                telegram_id: telegram_ids
            }
        })
        return users
    } catch (error) {
        console.error(`Error fetching users by telegram_ids:`, error)
        throw error
    }
}
