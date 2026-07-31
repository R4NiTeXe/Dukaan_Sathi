import mongoose from 'mongoose'
import dns from 'node:dns'
import config from '../config/index.js'

dns.setServers(['8.8.8.8', '1.1.1.1'])

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const connectDB = async (attempts = 3) => {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const connectionInstance = await mongoose.connect(config.db.uri, {
        dbName: config.db.name,
        serverSelectionTimeoutMS: 10000,
      })
      console.log(
        `MongoDB connected: ${connectionInstance.connection.host}/${config.db.name}`
      )
      return connectionInstance
    } catch (error) {
      lastError = error
      console.error(
        `MongoDB connection attempt ${attempt}/${attempts} failed: ${error.message}`
      )
      if (attempt < attempts) {
        await delay(2000 * attempt)
      }
    }
  }
  throw new Error(
    `Could not connect to MongoDB after ${attempts} attempts (${lastError?.message ?? 'unknown error'}). ` +
      'Check MONGODB_URI and network access.'
  )
}

export default connectDB
