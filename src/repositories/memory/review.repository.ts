import {
  memoryListReviewsByProperty,
  memoryFindReviewById,
  memoryFindReviewByPropertyAndUser,
  memoryCreateReview,
  memoryUpdateReview,
  memoryDeleteReview,
  memoryCalculateAverageRating,
  memoryResetForDev,
} from '../../store/memoryReviews'
import type { IReviewRepository } from '../types'

export function createMemoryReviewRepository(): IReviewRepository {
  return {
    async listByProperty(propertyId: string) {
      return memoryListReviewsByProperty(propertyId)
    },
    async findById(id: string) {
      return memoryFindReviewById(id)
    },
    async findByPropertyAndUser(propertyId: string, userId: string) {
      return memoryFindReviewByPropertyAndUser(propertyId, userId)
    },
    async create(params) {
      return memoryCreateReview(params)
    },
    async update(id: string, patch) {
      return memoryUpdateReview(id, patch)
    },
    async delete(id: string) {
      return memoryDeleteReview(id)
    },
    async getAverageRating(propertyId: string) {
      return memoryCalculateAverageRating(propertyId)
    },
  }
}

export function getMemoryReviewReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
