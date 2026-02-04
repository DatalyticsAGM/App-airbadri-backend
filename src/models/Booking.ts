/**
 * Modelo Mongoose de reserva. Usado por repositories/mongo cuando la persistencia es MongoDB.
 */
import mongoose, { Schema } from 'mongoose'

const statusEnum = ['pending', 'confirmed', 'cancelled', 'completed'] as const

const bookingSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    guests: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: statusEnum, required: true, default: 'pending' },
  },
  { timestamps: true }
)

bookingSchema.index({ userId: 1 })
bookingSchema.index({ propertyId: 1 })

export const Booking = mongoose.model('Booking', bookingSchema)
