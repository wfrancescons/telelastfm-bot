import { getWeeklyTrackChart } from '../controllers/lastfm.js'
import { getAllRankGroups } from '../database/rank.js'
import { getSpecificUsers, updateUserScrobbles } from '../database/user.js'

async function getLastfmData(lastfm_user) {
    try {
        const lastfm_data = await getWeeklyTrackChart(lastfm_user)

        const tracks = lastfm_data.weeklytrackchart.track
        const length = tracks.length

        const scrobbles = tracks.reduce((accum, curr) => {
            return accum + Number(curr.playcount)
        }, 0)

        return {
            scrobbles,
            tracks: length
        }

    } catch (error) {
        console.error(error)

        return {
            scrobbles: 0,
            tracks: 0
        }
    }
}

async function getUsers() {
    try {
        const groups = await getAllRankGroups()
        const users = groups.flatMap(group => {
            return group.users.map(user => user.telegram_id)
        })

        const unique_users = [...new Set(users)]
        return unique_users

    } catch (error) {
        console.log(error)
    }
}

export default function () {
    return new Promise(async (resolve, reject) => {
        try {
            const telegram_ids = await getUsers()
            const users_infos = await getSpecificUsers(telegram_ids)

            const updated_infos = await Promise.all(
                users_infos.map(async (item) => {
                    const lastfm_data = await getLastfmData(item.lastfm_username)
                    return { telegram_id: item.telegram_id, lastfm_data }
                }))

            await Promise.all(
                updated_infos.map(async (item) => {
                    await updateUserScrobbles(item.telegram_id, item.lastfm_data)
                })
            )
            resolve()
        } catch (error) {
            reject(error)
        }
    })
}