import { DataTypes } from 'sequelize'

function Nick(sequelize) {
    return sequelize.define('Nick', {
        chat_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        added_by: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        artist_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        artist_nick: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, { timestamps: true })
}

export default Nick