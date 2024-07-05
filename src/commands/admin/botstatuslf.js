import config from '../../config.js'
import { countUsagesToday } from '../../database/services/commandUsageLog.js'
import { countUsers } from '../../database/services/user.js'
import errorHandler from '../../handlers/errorHandler.js'
import { getCacheSize } from '../../utils/cache.js'
import { sendTextMessage } from '../../utils/messageSender.js'

async function botstatuslf(ctx) {

    const telegram_id = ctx.message.from.id

    if (!config.bot.admin.includes(telegram_id.toString())) return

    try {

        ctx.replyWithChatAction('typing').catch(error => console.error(error))

        const users_count = await countUsers()
        const cache_size = getCacheSize()

        const uptime_total = process.uptime()
        const uptime_hours = Math.floor(uptime_total / 3600)
        const uptime_minutes = Math.floor((uptime_total % 3600) / 60)
        const uptime_seconds = Math.floor(uptime_total % 60)
        const uptime = `${uptime_hours}h${uptime_minutes}min${uptime_seconds}s`

        const usage_count_today = await countUsagesToday()

        const message = '' +
            '*🤖 BOT STATUS:*\n\n' +
            `*⏲️ Bot Uptime:* ${uptime}\n` +
            `*🗃️ Cache Size:* ${cache_size}GB\n` +
            `*👥 Users' Count:* ${users_count.toLocaleString('pt-BR')}\n` +
            `*💻 Bot Usage (today):* ${usage_count_today.toLocaleString('pt-BR')}\n`

        const extras = {
            parse_mode: 'Markdown',
            entities: message.entities,
            reply_to_message_id: ctx.message?.message_id
        }

        await sendTextMessage(ctx, message, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default botstatuslf
