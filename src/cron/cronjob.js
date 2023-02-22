import cron from 'node-cron'
import sendMessages from './sendMessages.js'
import updateUserScrobbles from './updateUserScrobbles.js'
import updateValidUsers from './updateValidUsers.js'

export default cron.schedule('0 20 * * *', async () => {
    try {
        console.log('CRONJOB: task started')
        await updateValidUsers()
        await updateUserScrobbles()
        await sendMessages()
        console.log('CRONJOB: task finished')
    } catch (error) {
        console.log(error)
    }
}, { timezone: "America/Sao_Paulo" })