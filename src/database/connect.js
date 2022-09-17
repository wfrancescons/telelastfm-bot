import Mongoose from 'mongoose'
import config from '../config.js'

const connectToDb = async () => {
  try {
    await Mongoose.connect(config.mongoURI)
    console.log('MongoDB connected!')
  } catch (error) {
    console.log(error)
  }
}

export default connectToDb
