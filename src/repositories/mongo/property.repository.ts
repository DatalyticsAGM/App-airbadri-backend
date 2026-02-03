import type { Property } from '../../store/memoryProperties'
import { Property as PropertyModel } from '../../models/Property'

function toProperty(doc: { _id: { toString(): string }; hostId: { toString(): string }; title: string; description: string; location: string; pricePerNight: number; images: string[]; amenities: string[]; propertyType?: string; bedrooms?: number; bathrooms?: number; maxGuests?: number; createdAt: Date; updatedAt: Date }): Property {
  return {
    id: doc._id.toString(),
    hostId: doc.hostId.toString(),
    title: doc.title,
    description: doc.description,
    location: doc.location,
    pricePerNight: doc.pricePerNight,
    images: doc.images || [],
    amenities: doc.amenities || [],
    propertyType: doc.propertyType as Property['propertyType'],
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    maxGuests: doc.maxGuests,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function createPropertyRepository(): import('../types').IPropertyRepository {
  return {
    async list() {
      const docs = await PropertyModel.find().lean().sort({ createdAt: -1 })
      return docs.map((d) => toProperty(d as Parameters<typeof toProperty>[0]))
    },

    async getById(id: string) {
      const doc = await PropertyModel.findById(id).lean()
      if (!doc) return null
      return toProperty(doc as Parameters<typeof toProperty>[0])
    },

    async listByHost(hostId: string) {
      const docs = await PropertyModel.find({ hostId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toProperty(d as Parameters<typeof toProperty>[0]))
    },

    async create(params) {
      const doc = await PropertyModel.create({
        hostId: params.hostId,
        title: params.title,
        description: params.description,
        location: params.location,
        pricePerNight: params.pricePerNight,
        images: params.images || [],
        amenities: params.amenities || [],
        propertyType: params.propertyType,
        bedrooms: params.bedrooms,
        bathrooms: params.bathrooms,
        maxGuests: params.maxGuests,
      })
      return toProperty(doc as unknown as Parameters<typeof toProperty>[0])
    },

    async update(id: string, patch) {
      const doc = await PropertyModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean()
      if (!doc) return null
      return toProperty(doc as Parameters<typeof toProperty>[0])
    },

    async delete(id: string) {
      const result = await PropertyModel.findByIdAndDelete(id)
      return Boolean(result)
    },
  }
}
