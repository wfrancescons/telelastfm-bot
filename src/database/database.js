import { Sequelize } from 'sequelize'
import config from '../config.js'
import initializeModels from './models.js'

const sequelize = new Sequelize({
    ...config.sequelize,
    define: {
        underscored: true
    }
})

const Models = initializeModels(sequelize)

Models.User.hasOne(Models.UserStreaks, { foreignKey: 'telegram_id' })
Models.User.hasOne(Models.WeeklyScrobblesPlaycount, { foreignKey: 'telegram_id' })
Models.User.hasMany(Models.RankGroupParticipants, { foreignKey: 'telegram_id', sourceKey: 'telegram_id' })

Models.UserStreaks.belongsTo(Models.User, { foreignKey: 'telegram_id' })
Models.WeeklyScrobblesPlaycount.belongsTo(Models.User, { foreignKey: 'telegram_id' })
Models.RankGroupParticipants.belongsTo(Models.User, { foreignKey: 'telegram_id', targetKey: 'telegram_id' })

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