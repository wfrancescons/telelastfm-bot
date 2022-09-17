import Mongoose from 'mongoose';

const { Schema, model } = Mongoose;

const ArtistSchema = new Schema({
  chat_id: { type: Number, required: true },
  artists: [
    {
      artist_name: String,
      artist_nick: String,
      added_by: Number,
    },
  ],
});

const Artist = model('Artist', ArtistSchema);

export default Artist;
