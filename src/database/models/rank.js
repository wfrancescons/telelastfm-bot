import Mongoose from 'mongoose'
const { Schema, model } = Mongoose

const RankSchema = new Schema({
    chat_id: { type: Number, required: true },
    users: [{
        type: new Schema({
            telegram_id: { type: Number, required: true }
        }, { timestamps: true })
    }],
}, {
    timestamps: true
})

const Rank = model('Rank', RankSchema)

export default Rank