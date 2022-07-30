const mongoose = require('mongoose')

const mongoURI = process.env.MONGODB_URI

mongoose.connect(mongoURI)

const db = mongoose.connection
db.on('erro', erro => console.log('erro', erro))

module.exports = db