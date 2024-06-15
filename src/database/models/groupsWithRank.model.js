import { DataTypes } from 'sequelize'

function GroupsWithRank(sequelize) {
    return sequelize.define('GroupsWithRank', {
        chat_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            primaryKey: true,
        }
    }, { timestamps: true })
}

export default GroupsWithRank