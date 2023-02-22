import bot from '../bot.js'
import { getAllRankGroups, updateUsersInGroups } from '../database/rank.js'

const verifyMember = async (chat_id, user) => {
    try {
        const validUsersStatus = ['administrator', 'member', 'creator', 'restricted']
        const member_info = await bot.telegram.getChatMember(chat_id, user.telegram_id)

        if (!validUsersStatus.includes(member_info.status)) return null
        return user
    } catch (error) {
        console.log(error)
        return null
    }
}

export default () => {
    return new Promise(async (resolve, reject) => {
        try {
            const groups = await getAllRankGroups()

            await Promise.all(
                groups.map(async (group) => {
                    const users_status = await Promise.all(group.users.map(async (user) => await verifyMember(group.chat_id, user)))
                    const valid_users = users_status.reduce((acc, curr) => {
                        if (curr) {
                            acc.push({ telegram_id: curr.telegram_id })
                        }
                        return acc
                    }, [])
                    await updateUsersInGroups(group.chat_id, valid_users)
                })
            )
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}