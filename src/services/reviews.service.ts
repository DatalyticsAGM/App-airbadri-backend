import { httpError } from '../middlewares/errorHandler'
import { memoryGetPropertyById } from '../store/memoryProperties'
import { memoryListBookingsByUser } from '../store/memoryBookings'
import { isBookingCompleted } from './bookings.service'
import { createNotification } from './notifications.service'
import {
  memoryCalculateAverageRating,
  memoryCreateReview,
  memoryDeleteReview,
  memoryFindReviewById,
  memoryFindReviewByPropertyAndUser,
  memoryListReviewsByProperty,
  memoryUpdateReview,
  type Review,
} from '../store/memoryReviews'
import { findUserById } from './auth.service'

export function listReviewsByProperty(propertyId: string) {
  const property = memoryGetPropertyById(propertyId)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')

  const items = memoryListReviewsByProperty(propertyId)
  const averageRating = memoryCalculateAverageRating(propertyId)
  return { items, averageRating, total: items.length }
}

function userHasCompletedBooking(userId: string, propertyId: string) {
  const bookings = memoryListBookingsByUser(userId).filter((b) => b.propertyId === propertyId)
  return bookings.some((b) => isBookingCompleted(b))
}

export async function createReview(userId: string, input: {
  propertyId: string
  rating: number
  comment: string
  ratingDetails?: any
}) {
  const propertyId = String(input.propertyId || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  const property = memoryGetPropertyById(propertyId)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')

  if (!userHasCompletedBooking(userId, propertyId)) {
    throw httpError(403, 'FORBIDDEN', 'Only users with a completed booking can review')
  }

  const existing = memoryFindReviewByPropertyAndUser(propertyId, userId)
  if (existing) throw httpError(409, 'REVIEW_ALREADY_EXISTS', 'Review already exists')

  const rating = Math.trunc(Number(input.rating))
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw httpError(400, 'VALIDATION_ERROR', 'rating must be between 1 and 5')
  }

  const comment = String(input.comment || '').trim()
  if (!comment) throw httpError(400, 'VALIDATION_ERROR', 'comment is required')

  const user = await findUserById(userId)
  if (!user) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const userName = user.fullName
  const userAvatar = (user as any).avatarUrl || ''

  const review = memoryCreateReview({
    propertyId,
    userId,
    rating,
    ratingDetails: input.ratingDetails,
    comment,
    date: new Date().toISOString(),
    userName,
    userAvatar,
  })

  // Notificación MOCK para el host
  if (property.hostId && property.hostId !== userId) {
    createNotification({
      userId: property.hostId,
      type: 'new_review',
      title: 'Nueva review',
      message: `Nueva review en "${property.title}" (${rating}/5).`,
      link: `/properties/${propertyId}`,
    })
  }

  return review
}

export function getReviewByIdOrThrow(id: string) {
  const review = memoryFindReviewById(id)
  if (!review) throw httpError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return review
}

export function updateReview(userId: string, reviewId: string, patch: Partial<Pick<Review, 'rating' | 'comment'>>) {
  const current = getReviewByIdOrThrow(reviewId)
  if (current.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  const next: any = {}
  if (patch.rating !== undefined) {
    const rating = Math.trunc(Number(patch.rating))
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw httpError(400, 'VALIDATION_ERROR', 'rating must be between 1 and 5')
    }
    next.rating = rating
  }

  if (patch.comment !== undefined) {
    const comment = String(patch.comment || '').trim()
    if (!comment) throw httpError(400, 'VALIDATION_ERROR', 'comment is required')
    next.comment = comment
  }

  next.date = new Date().toISOString()

  const updated = memoryUpdateReview(reviewId, next)
  if (!updated) throw httpError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return updated
}

export function deleteReview(userId: string, reviewId: string) {
  const current = getReviewByIdOrThrow(reviewId)
  if (current.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')
  memoryDeleteReview(reviewId)
  return true
}

