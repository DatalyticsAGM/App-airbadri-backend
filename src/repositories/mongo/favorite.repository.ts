import mongoose from 'mongoose'
import type { Favorite } from '../../store/memoryFavorites'
import { Favorite as FavoriteModel } from '../../models/Favorite'
import type { IFavoriteRepository } from '../types'

type FavoriteDoc = {
  _id: { toString(): string }
  userId: { toString(): string }
  propertyId: { toString(): string }
  date: string
}

function toFavorite(doc: FavoriteDoc): Favorite {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    propertyId: doc.propertyId.toString(),
    date: doc.date,
  }
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(String(id || ''))
}

export function createFavoriteRepository(): IFavoriteRepository {
  return {
    async getByUser(userId: string) {
      if (!isValidObjectId(userId)) return []
      const docs = await FavoriteModel.find({ userId }).lean().sort({ date: -1 })
      return docs.map((d) => toFavorite(d as FavoriteDoc))
    },

    async isFavorite(userId: string, propertyId: string) {
      if (!isValidObjectId(userId) || !isValidObjectId(propertyId)) return false
      const doc = await FavoriteModel.findOne({ userId, propertyId }).lean()
      return Boolean(doc)
    },

    async add(userId: string, propertyId: string) {
      const existing = await FavoriteModel.findOne({ userId, propertyId }).lean()
      if (existing) return toFavorite(existing as FavoriteDoc)
      const doc = await FavoriteModel.create({
        userId,
        propertyId,
        date: new Date().toISOString(),
      })
      return toFavorite(doc as FavoriteDoc)
    },

    async remove(userId: string, propertyId: string) {
      if (!isValidObjectId(userId) || !isValidObjectId(propertyId)) return false
      const result = await FavoriteModel.deleteOne({ userId, propertyId })
      return result.deletedCount > 0
    },
  }
}
