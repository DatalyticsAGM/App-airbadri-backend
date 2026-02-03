import mongoose, { Schema } from 'mongoose'

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, required: true, default: false },
    date: { type: String, required: true },
    link: { type: String, required: false },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1 })

export const Notification = mongoose.model('Notification', notificationSchema)
