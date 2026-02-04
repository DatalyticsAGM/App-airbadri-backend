/**
 * Modelo Mongoose de reseña. Usado por repositories/mongo cuando la persistencia es MongoDB.
 */
import mongoose, { Schema } from 'mongoose'

const ratingDetailsSchema = new Schema(
  {
    overall: Number,
    cleanliness: Number,
    accuracy: Number,
    communication: Number,
    location: Number,
    checkin: Number,
    value: Number,
  },
  { _id: false }
)

const reviewSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    ratingDetails: { type: ratingDetailsSchema, required: false },
    comment: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    userName: { type: String, required: true, trim: true },
    userAvatar: { type: String, required: false },
  },
  { timestamps: true }
)

reviewSchema.index({ propertyId: 1 })
reviewSchema.index({ propertyId: 1, userId: 1 }, { unique: true })

export const Review = mongoose.model('Review', reviewSchema)
