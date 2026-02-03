import mongoose, { Schema } from 'mongoose'

const propertyTypeEnum = ['apartment', 'house', 'cabin', 'hotel', 'other'] as const

const propertySchema = new Schema(
  {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    pricePerNight: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    propertyType: { type: String, enum: propertyTypeEnum, required: false },
    bedrooms: { type: Number, required: false },
    bathrooms: { type: Number, required: false },
    maxGuests: { type: Number, required: false },
  },
  { timestamps: true }
)

propertySchema.index({ hostId: 1 })

export const Property = mongoose.model('Property', propertySchema)
