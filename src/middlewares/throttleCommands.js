import { sendTextMessage } from '../utils/messageSender.js'

const cooldowns = {}

function getCooldown(telegram_id) {
    if (!cooldowns[telegram_id]) {
        cooldowns[telegram_id] = { count: 0, warned: false }
    }
    return cooldowns[telegram_id]
}

function removeCooldown(telegram_id) {
    delete cooldowns[telegram_id]
}

async function throttleCommands(ctx, next) {
    if (ctx.message && ctx.message.text?.startsWith?.('/')) {
        const telegram_id = ctx.from.id
        const user_cooldown = getCooldown(telegram_id)

        if (user_cooldown.count > 3) {
            if (!user_cooldown.warned) {

                const message = `Hey, you're using my commands too quickly! 🥴\n` +
                    `\n➡️ Please try again in 5 seconds.`

                const extras = {
                    reply_to_message_id: ctx.message?.message_id
                }

                sendTextMessage(ctx, message, extras)
                user_cooldown.warned = true
            }
            return
        }

        user_cooldown.count += 1
        user_cooldown.warned = false
        setTimeout(() => {
            user_cooldown.count -= 1
            if (user_cooldown.count === 0) {
                removeCooldown(telegram_id)
            }
        }, 4000)
        return next()
    }
    return next()
}

export default throttleCommands