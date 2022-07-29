const User = require('../models/user')
const { isValidUser } = require('./lastFm')

const newUser = (telegramId, lastfmUser) => {

    const newUser = new User({
        telegram_id: telegramId,
        lastfm_username: telegramUsername
    })

    return newUser.save((err, data) => {
        if (err) return reject({ status: 'erro', err })
        return resolve({ status: 'user', data })
    })

}

const getUser = async (ctx) => {

    const telegramId = ctx.message.from.id
    const telegramUsername = ctx.message.from?.username

    return new Promise((resolve, reject) => {
        User.findOne({ telegram_id: telegramId }, async (erro, data) => {
            if (!data) {
                if (telegramUsername) {
                    const isLastfmUser = await isValidUser(telegramUsername)

                    if (isLastfmUser) {
                        const newUser = new User({
                            telegram_id: telegramId,
                            lastfm_username: telegramUsername
                        })

                        newUser.save((err, data) => {
                            if (err) return reject({ status: 'erro', err })
                            return resolve({ status: 'user', data })
                        })
                    }
                } else {
                    return resolve({ status: 'not user' })
                }

            }
            if (erro) return reject({ status: 'erro', erro })
            return resolve({ status: 'user', data })
        })
    })

}

const updateUser = (ctx, arg) => {

    const telegramId = ctx.message.from.id
    const lastfmUsername = String(arg)

    return new Promise((resolve, reject) => {
        User.findOne({ telegram_id: telegramId }, async (erro, data) => {
            const isLastfmUser = await isValidUser(lastfmUsername)

            if (isLastfmUser) {
                if (!data) {
                    const newUser = new User({
                        telegram_id: telegramId,
                        lastfm_username: lastfmUsername
                    })

                    newUser.save((err, data) => {
                        if (err) return reject({ status: 'erro', err })
                        return resolve({ status: 'user', data })
                    })
                } else {
                    data.lastfm_username = lastfmUsername

                    return data.save((err, data) => {
                        if (err) return reject({ status: 'erro', err })
                        return resolve({ status: 'user', data })
                    })
                }


            }

            return resolve({ status: 'not user' })
        })
    })
}

module.exports = {
    getUser,
    updateUser
}