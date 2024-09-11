import { Op } from 'sequelize'
import { Models } from '../database.js'

const { RankGroupParticipants, User } = Models

async function getAllRankGroups() {
    try {
        const unique_groups = await RankGroupParticipants.findAll({
            attributes: ['chat_id'], // Seleciona apenas a coluna chat_id
            group: ['chat_id']       // Agrupa pelos valores únicos de chat_id
        })

        // Mapeia os resultados para retornar apenas os valores de chat_id
        const chat_ids = unique_groups.map(group => group.chat_id)

        return chat_ids
    } catch (error) {
        throw error
    }
}

async function getAllRankUsers() {
    try {
        const unique_users = await RankGroupParticipants.findAll({
            attributes: ['telegram_id'],
            include: [{
                model: User,
                attributes: ['lastfm_username'],
            }],
            distinct: true
        })

        const telegram_ids = unique_users.map(group => ({
            telegram_id: Number(group.telegram_id),
            lastfm_username: group.User.lastfm_username
        }))

        return telegram_ids
    } catch (error) {
        throw error
    }
}

async function getRecordsCountByChatId(chat_id) {
    try {
        const count = await RankGroupParticipants.count({
            where: { chat_id }
        })
        return count
    } catch (error) {
        throw error
    }

}

async function findOrCreateRecord(chat_id, telegram_id) {
    try {
        const [record, created] = await RankGroupParticipants.findOrCreate({ where: { chat_id, telegram_id } })
        if (created) {
            return record
        }
        throw 'RANK_REGISTERED_USER'
    } catch (error) {
        throw error
    }
}

async function getRecord(chat_id, telegram_id) {
    try {
        const record = await RankGroupParticipants.findOne({ where: { chat_id, telegram_id } })
        return record
    } catch (error) {
        throw error
    }
}

async function getUsersByChatId(chat_id) {
    try {
        const participants = await RankGroupParticipants.findAll({ where: { chat_id } })
        const participantsIds = participants.map(x => x.telegram_id)
        return participantsIds
    } catch (error) {
        throw error
    }
}

async function deleteRecord(chat_id, telegram_id) {
    try {
        const deleted = await RankGroupParticipants.destroy({ where: { chat_id, telegram_id } })
        return !!deleted
    } catch (error) {
        throw error
    }
}

async function removeInvalidUsersFromGroup(chat_id, validUserIds) {
    try {
        // Deletar todos os usuários que não estão na lista de usuários válidos
        const result = await RankGroupParticipants.destroy({
            where: {
                chat_id,
                telegram_id: {
                    [Op.notIn]: validUserIds,  // Seleciona todos os IDs que não estão na lista de IDs válidos
                },
            },
        })

        console.log(`Removed ${result} invalid users from group ${chat_id}`)
        return result
    } catch (error) {
        console.error(`Error removing invalid users from group ${chat_id}:`, error)
        throw error
    }
}

export { deleteRecord, findOrCreateRecord, getAllRankGroups, getAllRankUsers, getRecord, getRecordsCountByChatId, getUsersByChatId, removeInvalidUsersFromGroup }

