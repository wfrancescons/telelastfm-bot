import commandUsageLogsModel from './commandUsageLogs.js'
import userModel from './user.js'

function initializeModels(sequelize) {
    const User = userModel(sequelize)
    const CommandUsageLogs = commandUsageLogsModel(sequelize)

    return {
        User,
        CommandUsageLogs
    }
}

export default initializeModels
