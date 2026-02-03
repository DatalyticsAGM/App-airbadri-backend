import type { Favorite } from '../../store/memoryFavorites'
import { Favorite as FavoriteModel } from '../../models/Favorite'

function toFavorite(doc: { _id: { toString(): string }; userId: { toString(): string }; propertyId: { toString(): string }; date: string }): Favorite {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    propertyId: doc.propertyId.toString(),
    date: doc.date,
  }
}

export function createFavoriteRepository(): import('../types').IFavoriteRepository {
  return {
    async getByUser(userId: string) {
      const docs = await FavoriteModel.find({ userId }).lean().sort({ date: -1 })
      return docs.map((d) => toFavorite(d as Parameters<typeof toFavorite>[0]))
    },

    async isFavorite(userId: string, propertyId: string) {
      const doc = await FavoriteModel.findOne({ userId, propertyId }).lean()
      return Boolean(doc)
    },

    async add(userId: string, propertyId: string) {
      const existing = await FavoriteModel.findOne({ userId, propertyId }).lean()
      if (existing) return toFavorite(existing as Parameters<typeof toFavorite>[0])
      const doc = await FavoriteModel.create({
        userId,
        propertyId,
        date: new Date().toISOString(),
      })
      return toFavorite(doc as unknown as Parameters<typeof toFavorite>[0])
    },

    async remove(userId: string, propertyId: string) {
      const result = await FavoriteModel.deleteOne({ userId, propertyId })
      return result.deletedCount > 0
    },
  }
}
