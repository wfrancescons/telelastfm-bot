import Mongoose from 'mongoose';
const { Schema, model } = Mongoose;

const UserSchema = new Schema({
  telegram_id: { type: Number, required: true },
  lastfm_username: String,
});

const User = model('User', UserSchema);

export default User;
