import { DataTypes } from 'sequelize'

function User(sequelize) {
    return sequelize.define('User', {
        telegram_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
            primaryKey: true,
        },
        lastfm_username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, { timestamps: true })
}

export default User