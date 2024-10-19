import os from 'os'; // Importa o módulo 'os'
import config from '../../config.js';
import { countUsagesToday } from '../../database/services/commandUsageLog.js';
import { countUsers } from '../../database/services/user.js';
import errorHandler from '../../handlers/errorHandler.js';
import { getCacheSize } from '../../utils/cache.js';
import { sendTextMessage } from '../../utils/messageSender.js';

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
        const uptime = `${uptime_hours}h ${uptime_minutes}min ${uptime_seconds}s`
        const usage_count_today = await countUsagesToday()

        // Obtém informações de memória e CPU
        const memory_rss = process.memoryUsage().rss / 1024 / 1024 // em MB
        const total_memory = os.totalmem() / 1024 / 1024 // Total em MB
        const memory_percent = ((memory_rss / total_memory) * 100).toFixed(2)

        const cpu_usage = process.cpuUsage() // CPU usage in microseconds
        const cpu_percent = (cpu_usage.user + cpu_usage.system) / 1000 // Convert to milliseconds
        const total_cpu_time = os.cpus().reduce((total, core) => total + core.times.user + core.times.nice + core.times.sys + core.times.idle + core.times.irq, 0) // Tempo total da CPU
        const cpu_usage_percentage = ((cpu_percent / total_cpu_time) * 100).toFixed(2) // Percentual de uso da CPU

        const message =
            `*🔍 BOT OVERVIEW 🔍*\n` +
            `🤖 ${config.bot.username}\n\n` +

            `*📊 Usage Statistics:*\n` +
            `Total Users: ${users_count.toLocaleString('pt-BR')}\n` +
            `Commands Triggered (Today): ${usage_count_today.toLocaleString('pt-BR')}\n\n` +

            `*🖥️ Server Information:*\n` +
            `Uptime: ${uptime}\n` +
            `Memory Usage: ${memory_rss.toFixed(2)} MB \(${memory_percent}%\)\n` +
            `CPU Usage: ${cpu_usage_percentage}%\n\n` +

            `*🗃️ Cache:*\n` +
            `Cache Size: ${cache_size} GB\n`

        const extras = {
            parse_mode: 'Markdown',
            reply_to_message_id: ctx.message?.message_id
        }

        await sendTextMessage(ctx, message, extras)
    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default botstatuslf
