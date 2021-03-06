import mongoose from 'mongoose'
import { app } from './app'

const start = async () => {
  const PORT = 3000
  console.log('Starting up...')
  if (!process.env.JWT_KEY) {
    throw new Error('`process.env.JWT_KEY variable is not set')
  }

  if (!process.env.MONGO_URI) {
    throw new Error('`process.env.MONGO_URI variable is not set')
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error(err)
  }

  app.listen(PORT, () => {
    console.log('Listening on port: ' + PORT)
  })
}

start()