const checkSendMediaPermission = (ctx) => {
    return new Promise(async (resolve, reject) => {
        try {

            const userInfo = await ctx.getChatMember(ctx.botInfo.id)

            if (userInfo.status === 'restricted' && userInfo?.can_send_media_messages === false) resolve(false)
            if (userInfo.status === 'member') {
                const chatInfo = await ctx.getChat(ctx.chat.id)
                if (chatInfo?.permission?.can_send_media_messages === false) resolve(false)
            }

            resolve(true)

        } catch (error) {
            console.error(error)
            reject(error)
        }
    })
}

export default checkSendMediaPermission