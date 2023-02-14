import Mongoose from 'mongoose'
import config from '../config.js'

const connectToDb = () => {

  console.log('Connecting to database...')

  return Mongoose.connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000
  })
}

export default connectToDb