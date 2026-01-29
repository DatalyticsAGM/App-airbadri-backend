import mongoose from 'mongoose'

export async function connectDb(mongoUri: string) {
  await mongoose.connect(mongoUri)
  return mongoose.connection
}

