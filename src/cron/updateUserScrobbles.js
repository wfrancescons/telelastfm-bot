import { getAllRankUsers } from '../database/services/rankGroupParticipants.js'
import { setUserScrobbles } from '../database/services/weeklyScrobblesPlaycount.js'
import { getWeeklyTrackChart } from '../services/lastfm.js'

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

async function updateUserScrobbles() {
    try {
        const rank_users = await getAllRankUsers()

        for (const user of rank_users) {
            const lastfm_data = await getLastfmData(user.lastfm_username)
            await setUserScrobbles(user.telegram_id, lastfm_data)
        }
    } catch (error) {
        throw error
    }
}

export default updateUserScrobbles