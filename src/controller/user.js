const { getUserInfo } = require('../lastfm.js')
const User = require('../models/user')

const createUser = (telegram_id, lastfm_username) => {
    return new Promise((resolve, reject) => {
        const newUser = new User({
            telegram_id,
            lastfm_username
        })

        newUser.save((erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })

}

const getUser = (telegram_id) => {
    return new Promise((resolve, reject) => {
        User.findOne({ telegram_id }, (erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })
}

const updateUser = (telegram_id, lastfm_username) => {
    return new Promise((resolve, reject) => {
        User.findOneAndUpdate({ telegram_id }, { lastfm_username }, (erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })
}

const getLastfmUser = (ctx) => {
    return new Promise(async (resolve, reject) => {
        try {
            const telegram_id = ctx.message.from.id
            const telegram_username = ctx.message.from?.username

            const user = await getUser(telegram_id)

            if (!user) {
                if (telegram_username) {
                    const userInfo = await getUserInfo(telegram_username)

                    if (userInfo.user === 'not found') {
                        resolve()
                    } else {
                        const newUser = await createUser(telegram_id, telegram_username)
                        resolve(newUser.lastfm_username)
                    }
                } else {
                    resolve()
                }

            } else {
                resolve(user.lastfm_username)
            }

        } catch (erro) {
            reject(erro)
        }
    })
}

const setLastfmUser = (telegram_id, lastfm_username) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await getUser(telegram_id)

            if (!user) {
                if (lastfm_username) {
                    const userInfo = await getUserInfo(lastfm_username)

                    if (userInfo.user === 'not found') {
                        resolve()
                    } else {
                        const newUser = await createUser(telegram_id, lastfm_username)
                        resolve(newUser.lastfm_username)
                    }
                } else {
                    resolve()
                }

            } else {
                const userInfo = await getUserInfo(lastfm_username)

                if (userInfo.user === 'not found') {
                    resolve()
                } else {
                    const updatedUser = await updateUser(telegram_id, lastfm_username)
                    resolve(updatedUser.lastfm_username)
                }
            }

        } catch (erro) {
            reject(erro)
        }
    })
}

module.exports = {
    getLastfmUser,
    setLastfmUser
}