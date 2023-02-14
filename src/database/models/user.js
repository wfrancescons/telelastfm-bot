import Mongoose from 'mongoose'
const { Schema, model } = Mongoose

const UserSchema = new Schema({
  telegram_id: { type: Number, required: true },
  lastfm_username: String,
  weekly_scrobbles_playcount: {
    current_week_playcount: Number,
    last_week_playcount: Number,
    updatedAt: { type: Date }
  }
}, {
  timestamps: true
})

const User = model('User', UserSchema)

export default User