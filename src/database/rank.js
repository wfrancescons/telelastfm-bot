import Rank from './models/rank.js'

const createRank = (chat_id) => {
    return new Promise((resolve, reject) => {
        const newChatGroup = new Rank({ chat_id })

        newChatGroup.save((erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })
}

const deleteRank = (chat_id) => {
    return new Promise((resolve, reject) => {
        Rank.deleteOne({ chat_id }, (erro, data) => {
            if (erro) reject(erro)
            if (data.deletedCount === 1) {
                resolve(data)
            } else {
                resolve(null)
            }
        })
    })
}

const getAllRankGroups = () => {
    return new Promise((resolve, reject) => {
        Rank.find({ users: { $exists: true, $ne: [] } }, (erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })
}

const createUser = (chat_id, telegram_id) => {
    return new Promise((resolve, reject) => {
        Rank.findOneAndUpdate(
            { chat_id },
            { $push: { users: { telegram_id, addedAt: Date.now() } } },
            { new: true }, (erro, data) => {
                if (data) {
                    resolve(data)
                } else {
                    reject(erro)
                }
            })
    })
}

//OK
const getUser = (chat_id, telegram_id) => {
    return new Promise((resolve, reject) => {
        Rank.findOne({ chat_id, 'users.telegram_id': telegram_id }, { 'users.$': 1 }, (erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })
}

//OK
const getUsers = (chat_id) => {
    return new Promise((resolve, reject) => {
        Rank.findOne({ chat_id }, (erro, data) => {
            erro ? reject(erro) : resolve(data?.users)
        })
    })
}

//OK
const newUser = (chat_id, telegram_id) => {
    return new Promise(async (resolve, reject) => {
        try {

            const recordExists = await Rank.findOne({ chat_id })

            if (!recordExists) {

                await createRank(chat_id)
                const newUser = await createUser(chat_id, telegram_id)
                resolve({ user: newUser, users_length: 1 })

            } else {

                const userExists = await getUser(chat_id, telegram_id)

                if (!userExists) {

                    const newUser = await createUser(chat_id, telegram_id)
                    const rankGroup = await getUsers(chat_id)
                    resolve({ user: newUser, users_length: rankGroup.length })

                } else {

                    const rankGroup = await getUsers(chat_id)
                    reject('RANK_REGISTERED_USER')

                }
            }

        } catch (erro) {

            reject(erro)

        }
    })
}

//OK
const deleteUser = (chat_id, telegram_id) => {
    return new Promise((resolve, reject) => {
        Rank.findOneAndUpdate({ chat_id, 'users.telegram_id': telegram_id }, { $pull: { users: { telegram_id } } }, (erro, data) => {
            if (erro) reject(erro)
            if (data) {
                resolve(data)
            } else {
                resolve(null)
            }
        })
    })
}

const updateUsersInGroups = (chat_id, users) => {
    return new Promise((resolve, reject) => {
        Rank.updateOne({ chat_id }, { '$set': { users } }, (erro, data) => {
            erro ? reject(erro) : resolve(data?.users)
        })
    })
}

export {
    newUser,
    getUsers,
    deleteUser,
    getUser,
    deleteRank,
    getAllRankGroups,
    updateUsersInGroups
}
