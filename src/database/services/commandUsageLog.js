import { Op } from 'sequelize'
import { Models } from '../database.js'

const { CommandUsageLogs } = Models

async function logCommand(command, telegram_id, chat_id) {
    try {
        await CommandUsageLogs.create({ command, telegram_id, chat_id })
    } catch (error) {
        console.error('DB: Error when trying to register command usage: ', error)
    }
}

async function countUsagesToday() {
    try {
        const day_start = new Date()
        day_start.setHours(0, 0, 0, 0)

        const day_end = new Date()
        day_end.setHours(23, 59, 59, 999)

        const usage_count = await CommandUsageLogs.count({
            where: {
                timestamp: {
                    [Op.between]: [day_start, day_end]
                }
            }
        })
        return usage_count
    } catch (error) {
        throw error
    }
}

export { countUsagesToday, logCommand }

