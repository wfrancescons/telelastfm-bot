import moment from 'moment'

import { Models } from '../database.js'

const { UserStreaks } = Models

async function createUserStreaks(telegram_id) {
    try {
        const user_streaks = await UserStreaks.create({ telegram_id })
        return user_streaks
    } catch (error) {
        throw error
    }
}

async function findStreaksByPkOrCreate(telegram_id) {
    try {
        let user_streaks = await UserStreaks.findByPk(telegram_id)
        if (!user_streaks) {
            user_streaks = await createUserStreaks(telegram_id)
        }
        return user_streaks

    } catch (error) {
        throw error
    }
}

async function incrementUserStreaks(telegram_id) {
    try {
        const user_streaks = await UserStreaks.findByPk(telegram_id)
        let { streaks_count, streaks_peak } = user_streaks

        console.log({ user_streaks })

        streaks_count++

        const updated_data = {
            streaks_count,
            last_streak_timestamp: new Date
        }

        if (streaks_count > streaks_peak) updated_data.streaks_peak = streaks_count

        await user_streaks.update(updated_data)

        return user_streaks
    } catch (error) {
        throw error
    }
}

async function resetUserStreaks(telegram_id) {
    try {
        const user_streaks = await UserStreaks.findByPk(telegram_id)
        await user_streaks.update({
            streaks_count: 0,
            last_streak_timestamp: new Date
        })
        return user_streaks
    } catch (error) {
        throw error
    }
}

async function updateStreaks(telegram_id) {

    const user_streaks = await findStreaksByPkOrCreate(telegram_id)

    const today = moment().startOf('day')
    const lastStreakDate = moment(user_streaks.last_streak_timestamp).startOf('day')

    const diffDays = today.diff(lastStreakDate, 'days')

    if (diffDays === 1) return await incrementUserStreaks(telegram_id)
    if (diffDays >= 2) return await resetUserStreaks(telegram_id)

    return user_streaks
}

export { findStreaksByPkOrCreate, updateStreaks }

