import crypto from 'crypto'

export type RatingBreakdown = {
  overall?: number
  cleanliness?: number
  accuracy?: number
  communication?: number
  location?: number
  checkin?: number
  value?: number
}

export type Review = {
  id: string
  propertyId: string
  userId: string
  rating: number // 1-5
  ratingDetails?: RatingBreakdown
  comment: string
  date: string // ISO string
  userName: string
  userAvatar?: string
  createdAt: Date
  updatedAt: Date
}

const reviewsById = new Map<string, Review>()

function now() {
  return new Date()
}

export function memoryListReviewsByProperty(propertyId: string) {
  return Array.from(reviewsById.values()).filter((r) => r.propertyId === propertyId)
}

export function memoryFindReviewById(id: string) {
  return reviewsById.get(id) || null
}

export function memoryFindReviewByPropertyAndUser(propertyId: string, userId: string) {
  for (const r of reviewsById.values()) {
    if (r.propertyId === propertyId && r.userId === userId) return r
  }
  return null
}

export function memoryCreateReview(params: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>) {
  const t = now()
  const id = crypto.randomUUID()
  const review: Review = { id, ...params, createdAt: t, updatedAt: t }
  reviewsById.set(id, review)
  return review
}

export function memoryUpdateReview(
  id: string,
  patch: Partial<Pick<Review, 'rating' | 'ratingDetails' | 'comment' | 'date'>>
) {
  const current = reviewsById.get(id)
  if (!current) return null

  const updated: Review = {
    ...current,
    ...patch,
    id: current.id,
    propertyId: current.propertyId,
    userId: current.userId,
    userName: current.userName,
    userAvatar: current.userAvatar,
    createdAt: current.createdAt,
    updatedAt: now(),
  }

  reviewsById.set(id, updated)
  return updated
}

export function memoryDeleteReview(id: string) {
  return reviewsById.delete(id)
}

export function memoryCalculateAverageRating(propertyId: string) {
  const items = memoryListReviewsByProperty(propertyId)
  if (items.length === 0) return 0
  const sum = items.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / items.length) * 10) / 10 // 1 decimal
}

/** Solo para uso en seed de desarrollo. Vacía todas las reviews. */
export function memoryResetForDev() {
  reviewsById.clear()
}

