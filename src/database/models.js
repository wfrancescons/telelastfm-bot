import CommandUsageLogsModel from './models/commandUsageLogs.js'
import RankGroupParticipantsModel from './models/rankGroupParticipants.js'
import UserModel from './models/user.js'
import UserStreaksModel from './models/userStreaks.js'
import WeeklyScrobblesPlaycountModel from './models/weeklyScrobblesPlaycount.js'

function initializeModels(sequelize) {
    const User = UserModel(sequelize)
    const CommandUsageLogs = CommandUsageLogsModel(sequelize)
    const UserStreaks = UserStreaksModel(sequelize)
    const WeeklyScrobblesPlaycount = WeeklyScrobblesPlaycountModel(sequelize)
    const RankGroupParticipants = RankGroupParticipantsModel(sequelize)

    return {
        User,
        CommandUsageLogs,
        UserStreaks,
        RankGroupParticipants,
        WeeklyScrobblesPlaycount
    }
}

export default initializeModels