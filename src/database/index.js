const mongoose = require('mongoose')

const mongoURI = process.env.MONGODB_URI

mongoose.connect(mongoURI)

const db = mongoose.connection
db.on('error', error => console.log('error', error))

module.exports = db