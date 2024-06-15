import { DataTypes } from 'sequelize'

function WeeklyScrobblesPlaycount(sequelize) {
    return sequelize.define('WeeklyScrobblesPlaycount', {
        telegram_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
        },
        scrobbles_playcount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tracks_playcount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        createdAt: 'timestamp',
        updatedAt: false
    })
}

export default WeeklyScrobblesPlaycount