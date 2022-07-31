const mongoose = require("mongoose")

const ArtistSchema = new mongoose.Schema({
    chat_id: { type: Number, required: true },
    artists: [{
        artist_name: String,
        artist_nick: String,
        added_by: Number
    }]
})

const Artist = mongoose.model('Artist', ArtistSchema)

module.exports = Artist