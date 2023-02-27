import Cron from 'croner'
import sendMessages from './sendMessages.js'
import updateUserScrobbles from './updateUserScrobbles.js'
import updateValidUsers from './updateValidUsers.js'

export default Cron('0 30 19 * * 0', { timezone: "America/Sao_Paulo" }, async () => {
    try {
        console.log('CRONJOB: Task started')
        await updateValidUsers()
        await updateUserScrobbles()
        await sendMessages()
        console.log('CRONJOB: Task finished')
    } catch (error) {
        console.log(error)
    }
})