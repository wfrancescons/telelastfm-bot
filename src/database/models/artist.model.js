import { DataTypes } from 'sequelize'

function Artist(sequelize) {
    return sequelize.define('Artist', {
        musicbrainz_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true,
        },
        spotify_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, { timestamps: true })
}

export default Artist