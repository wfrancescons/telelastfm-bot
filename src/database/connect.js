import Mongoose from 'mongoose'
import config from '../config.js'

async function connectToDb() {

  try {
    console.log('DATABASE: Connecting to MongoDB...')

    await Mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000
    })

  } catch (error) {
    throw error
  }

}

export default connectToDb