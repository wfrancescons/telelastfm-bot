import { DataTypes } from 'sequelize'

function CommandUsageLogs(sequelize) {
    return sequelize.define('CommandUsageLogs', {
        telegram_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        chat_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        command: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        createdAt: 'timestamp',
        updatedAt: false
    })
}

export default CommandUsageLogs