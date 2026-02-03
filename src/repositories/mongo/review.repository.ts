import mongoose from 'mongoose'
import type { Review, RatingBreakdown } from '../../store/memoryReviews'
import { Review as ReviewModel } from '../../models/Review'

function toReview(doc: {
  _id: { toString(): string }
  propertyId: { toString(): string }
  userId: { toString(): string }
  rating: number
  ratingDetails?: RatingBreakdown
  comment: string
  date: string
  userName: string
  userAvatar?: string
  createdAt: Date
  updatedAt: Date
}): Review {
  return {
    id: doc._id.toString(),
    propertyId: doc.propertyId.toString(),
    userId: doc.userId.toString(),
    rating: doc.rating,
    ratingDetails: doc.ratingDetails,
    comment: doc.comment,
    date: doc.date,
    userName: doc.userName,
    userAvatar: doc.userAvatar,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function createReviewRepository(): import('../types').IReviewRepository {
  return {
    async listByProperty(propertyId: string) {
      const docs = await ReviewModel.find({ propertyId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toReview(d as Parameters<typeof toReview>[0]))
    },

    async findById(id: string) {
      const doc = await ReviewModel.findById(id).lean()
      if (!doc) return null
      return toReview(doc as Parameters<typeof toReview>[0])
    },

    async findByPropertyAndUser(propertyId: string, userId: string) {
      const doc = await ReviewModel.findOne({ propertyId, userId }).lean()
      if (!doc) return null
      return toReview(doc as Parameters<typeof toReview>[0])
    },

    async create(params) {
      const doc = await ReviewModel.create({
        propertyId: params.propertyId,
        userId: params.userId,
        rating: params.rating,
        ratingDetails: params.ratingDetails,
        comment: params.comment,
        date: params.date,
        userName: params.userName,
        userAvatar: params.userAvatar,
      })
      return toReview(doc as unknown as Parameters<typeof toReview>[0])
    },

    async update(id: string, patch) {
      const doc = await ReviewModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean()
      if (!doc) return null
      return toReview(doc as Parameters<typeof toReview>[0])
    },

    async delete(id: string) {
      const result = await ReviewModel.findByIdAndDelete(id)
      return Boolean(result)
    },

    async getAverageRating(propertyId: string) {
      const agg = await ReviewModel.aggregate([
        { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ])
      if (agg.length === 0) return 0
      return Math.round(agg[0].avg * 10) / 10
    },
  }
}
