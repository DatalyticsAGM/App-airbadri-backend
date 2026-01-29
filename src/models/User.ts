import mongoose, { Schema } from 'mongoose'

export type UserDoc = {
  _id: mongoose.Types.ObjectId
  fullName: string
  email: string
  passwordHash: string
  resetPasswordTokenHash?: string
  resetPasswordExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetPasswordTokenHash: { type: String, required: false },
    resetPasswordExpiresAt: { type: Date, required: false },
  },
  { timestamps: true }
)

export const User = mongoose.model<UserDoc>('User', userSchema)

