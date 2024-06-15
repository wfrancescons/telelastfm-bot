import { Models } from '../database.js'

const { CommandUsageLogs } = Models

async function logCommand(command, telegram_id, chat_id) {
    try {
        await CommandUsageLogs.create({ command, telegram_id, chat_id })
    } catch (error) {
        console.error('DB: Error when trying to register command usage: ', error)
    }
}

export { logCommand }
