import Mongoose from 'mongoose'
const { Schema, model } = Mongoose

const RankSchema = new Schema({
    chat_id: { type: Number, required: true },
    users: [{
        telegram_id: { type: Number, required: true },
        addedAt: { type: Date }
    }],
}, {
    timestamps: true
})

const Rank = model('Rank', RankSchema)

export default Rank