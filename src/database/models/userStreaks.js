import { DataTypes } from 'sequelize'

function UserStreaks(sequelize) {
    return sequelize.define('UserStreaks', {
        telegram_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            primaryKey: true

        },
        streaks_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        last_streak_timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date
        }
    }, {
        createdAt: 'timestamp',
        updatedAt: false
    })
}

export default UserStreaks