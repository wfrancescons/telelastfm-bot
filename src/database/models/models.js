import commandUsageLogsModel from './commandUsageLogs.js'
import userModel from './user.js'
import UserStreaksModel from './userStreaks.js'

function initializeModels(sequelize) {
    const User = userModel(sequelize)
    const CommandUsageLogs = commandUsageLogsModel(sequelize)
    const UserStreaks = UserStreaksModel(sequelize)

    return {
        User,
        CommandUsageLogs,
        UserStreaks
    }
}

export default initializeModels
