import { logCommand } from '../database/services/commandUsageLog.js'

const validCommands = [
    'start',
    'help',
    'lf',
    'alblf',
    'artlf',
    'gridlf',
    'storylf',
    'setlf',
    'melf',
    'youlf',
    'toplf',
    'rankinlf',
    'rankoutlf'
]

function commandLogger(ctx, next) {

    if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
        const command = ctx.message.text.split(' ')[0].substring(1)
        const telegram_id = ctx.message.from.id
        const chat_id = ctx.message.chat.id

        if (validCommands.includes(command)) {
            logCommand(command, telegram_id, chat_id)
        }
    }
    return next()
}

export default commandLogger