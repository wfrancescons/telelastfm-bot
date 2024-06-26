import bot from '../bot.js'

function getChatMemberInfos(chatId, userId) {
    return new Promise(async (resolve, reject) => {
        try {

            const [chatMember, chatInfo] = await Promise.all([
                bot.telegram.getChatMember(chatId, userId),
                bot.telegram.getChat(chatId)
            ])

            const userStatus = chatMember.status
            const chatType = chatInfo.type
            const chatPermissions = chatInfo.permissions

            const result = { status: userStatus, chat_type: chatType }

            const validUserStatus = ['administrator', 'member', 'creator']
            const invalidUserStatus = ['left', 'kicked']
            const restrictedUserStatus = ['restricted']
            const groupTypes = ['group', 'supergroup']

            //'left', 'kicked'
            if (invalidUserStatus.includes(userStatus)) {
                resolve(result)

                //'administrator', 'member', 'creator' && 'group', 'supergroup'
            } else if (validUserStatus.includes(userStatus) && groupTypes.includes(chatType)) {
                result.permissions = chatPermissions
                resolve(result)

                //'restricted' && 'group', 'supergroup'
            } else if (restrictedUserStatus.includes(userStatus) && groupTypes.includes(chatType)) {
                result.permissions = chatMember
                resolve(result)

                //'restricted'
            } else if (restrictedUserStatus.includes(userStatus)) {
                result.permissions = chatMember
                resolve(result)

            } else {
                //conversa privada
                resolve(result)
            }

        } catch (error) {

            const erros = [
                {
                    desc: 'TelegramError: 400: Bad Request: user not found',
                    response: {
                        ok: false,
                        error_code: 400,
                        description: 'Bad Request: user not found'
                    },
                    on: {
                        method: 'getChatMember',
                        payload: { chat_id: -1001834217331, user_id: 5028529308 }
                    }
                },
                {
                    desc: 'TelegramError: 403: Forbidden: bot was kicked from the supergroup chat',
                    response: {
                        ok: false,
                        error_code: 403,
                        description: 'Forbidden: bot was kicked from the supergroup chat'
                    },
                    on: {
                        method: 'getChatMember',
                        payload: { chat_id: -1001834217331, user_id: 288412769 }
                    }
                }
            ]

            console.log('ERRO BOT:', error)
            //if (error?.response?.error_code === 403) reject('BOT_KICKED')
            reject(error)
        }
    })
}

function canSendMessage(chat_id, user_id) {
    if (chat_id > 0) return Promise.resolve(true)
    return new Promise(async (resolve, reject) => {
        try {
            const chatStatus = await getChatMemberInfos(chat_id, user_id)
            resolve((chatStatus.chat_type == 'supergroup' || chatStatus.chat_type == 'group') && chatStatus?.permissions.can_send_messages != false)
        } catch (error) {
            reject(error)
        }
    })
}

function canSendMediaMessage(chat_id, user_id) {
    if (chat_id > 0) return Promise.resolve(true)
    return new Promise(async (resolve, reject) => {
        try {
            const chatStatus = await getChatMemberInfos(chat_id, user_id)
            resolve((chatStatus.chat_type === 'supergroup' || chatStatus.chat_type === 'group') && chatStatus?.permissions.can_send_media_messages != false)
        } catch (error) {
            reject(error)
        }
    })
}

function isReplyToMsg(ctx) {
    return ctx.update.message.reply_to_message
}

function isChannelMsgForward(ctx) {
    return ctx.update.message.reply_to_message?.is_automatic_forward
}

function isChannel(ctx) {
    return ctx.update.message.from.id === 777000
}

export { canSendMediaMessage, canSendMessage, isChannel, isChannelMsgForward, isReplyToMsg }
