import mongoose from 'mongoose'
import type { Property } from '../../store/memoryProperties'
import { Property as PropertyModel } from '../../models/Property'
import type { IPropertyRepository } from '../types'

type PropertyDoc = {
  _id: { toString(): string }
  hostId: { toString(): string }
  title: string
  description: string
  location: string
  pricePerNight: number
  images: string[]
  amenities: string[]
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  createdAt: Date
  updatedAt: Date
}

function toProperty(doc: PropertyDoc): Property {
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

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(String(id || ''))
}

export function createPropertyRepository(): IPropertyRepository {
  return {
    async list() {
      const docs = await PropertyModel.find().lean().sort({ createdAt: -1 })
      return docs.map((d) => toProperty(d as PropertyDoc))
    },

    async getById(id: string) {
      if (!isValidObjectId(id)) return null
      const doc = await PropertyModel.findById(id).lean()
      if (!doc) return null
      return toProperty(doc as PropertyDoc)
    },

    async listByHost(hostId: string) {
      if (!isValidObjectId(hostId)) return []
      const docs = await PropertyModel.find({ hostId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toProperty(d as PropertyDoc))
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
      return toProperty(doc as PropertyDoc)
    },

    async update(id: string, patch) {
      if (!isValidObjectId(id)) return null
      const doc = await PropertyModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean()
      if (!doc) return null
      return toProperty(doc as PropertyDoc)
    },

    async delete(id: string) {
      if (!isValidObjectId(id)) return false
      const result = await PropertyModel.findByIdAndDelete(id)
      return Boolean(result)
    },
  }
}
