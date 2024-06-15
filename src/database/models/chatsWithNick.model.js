import { DataTypes } from 'sequelize'

function ChatsWithNick(sequelize) {
    return sequelize.define('ChatsWithNick', {
        chat_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            primaryKey: true,
        }
    }, { timestamps: true })
}

export default ChatsWithNick