const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    telegram_id: {type:Number, required:true},
    lastfm_username: String
})

const User = mongoose.model('User', UserSchema)

module.exports = User