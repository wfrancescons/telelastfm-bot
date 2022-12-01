import Mongoose from 'mongoose'
const { Schema, model } = Mongoose

const ArtistSchema = new Schema({
  chat_id: { type: Number, required: true },
  artists: [
    {
      type: new Schema({
        artist_name: String,
        artist_nick: String,
        added_by: Number
      }, {
        timestamps: true
      })
    },
  ],
}, {
  timestamps: true
})

const Artist = model('Artist', ArtistSchema)

export default Artist
