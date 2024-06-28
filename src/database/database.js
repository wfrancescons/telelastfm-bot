import { Sequelize } from 'sequelize'
import config from '../config.js'
import initializeModels from './models/models.js'

const sequelize = new Sequelize({
    ...config.sequelize,
    define: {
        underscored: true
    }
})

const Models = initializeModels(sequelize)

Models.User.hasOne(Models.UserStreaks, { foreignKey: 'telegram_id' })

Models.UserStreaks.belongsTo(Models.User, { foreignKey: 'telegram_id' })

/* Associations
ChatsWithNick.hasMany(Nick, { foreignKey: 'chat_id' })
User.hasMany(Nick, { foreignKey: 'added_by' })
User.hasOne(WeeklyScrobblesPlaycount, { foreignKey: 'telegram_id' })
User.hasMany(UsersInRank, { foreignKey: 'telegram_id' })
GroupsWithRank.hasMany(UsersInRank, { foreignKey: 'chat_id' })

Nick.belongsTo(ChatsWithNick, { foreignKey: 'chat_id' })
Nick.belongsTo(User, { foreignKey: 'added_by' })
WeeklyScrobblesPlaycount.belongsTo(User, { foreignKey: 'telegram_id' })
UsersInRank.belongsTo(GroupsWithRank, { foreignKey: 'chat_id' })
UsersInRank.belongsTo(User, { foreignKey: 'telegram_id' }) */

try {
    await sequelize.sync({ alter: true })
    console.log('DB: tabelas sincronizadas')

    const userCount = await Models.User.count()
    console.log(`DB: total de registros na tabela Users: ${userCount}`)

} catch (error) {
    console.error('DB: erro ao sincronizar tabelas ou contar registros - ', error)
}

export { Models }
export default sequelize