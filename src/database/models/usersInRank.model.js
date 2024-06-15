import { DataTypes } from 'sequelize'

function UsersInRank(sequelize) {
    return sequelize.define('UsersInRank', {
        chat_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        telegram_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
    }, { timestamps: true })
}

export default UsersInRank