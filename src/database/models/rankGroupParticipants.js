import { DataTypes } from 'sequelize'

function rankGroupParticipants(sequelize) {
    return sequelize.define('RankGroupParticipants', {
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

export default rankGroupParticipants