async function sendTextMessage(ctx, text, options = {}) {
    try {
        const reply = await ctx.reply(text, options)
        return reply
    } catch (error) {
        if (error.code === 400 && error.description.includes('message to be replied not found')) {
            // Tenta enviar a mensagem sem a opção reply_to_message_id se a mensagem original foi excluída
            const { reply_to_message_id, ...newOptions } = options
            const reply = await ctx.reply(text, newOptions)
            return reply
        } else {
            console.error(error)
        }
    }
}

async function sendPhotoMessage(ctx, photo, options = {}) {
    try {
        const reply = await ctx.replyWithPhoto(photo, options)
        return reply

    } catch (error) {
        if (error.code === 400 && error.description.includes('message to be replied not found')) {
            // Tenta enviar a mensagem sem a opção reply_to_message_id se a mensagem original foi excluída
            const { reply_to_message_id, ...newOptions } = options
            const reply = await ctx.replyWithPhoto(photo, newOptions)
            return reply

        } else {
            console.error(error)
        }
    }
}

export { sendPhotoMessage, sendTextMessage }

