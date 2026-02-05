/**
 * Módulo reviews.service (servicio de reseñas).
 *
 * Lógica de negocio de reseñas: listar por propiedad, crear (solo con reserva completada),
 * actualizar y eliminar. Usa repositorios (memoria o MongoDB) y notifica al host.
 */
import { httpError } from '../middlewares/errorHandler'
import { propertyRepository, bookingRepository, reviewRepository } from '../repositories'
import { isBookingCompleted } from './bookings.service'
import { createNotification } from './notifications.service'
import type { RatingBreakdown, Review } from '../store/memoryReviews'
import { findUserById } from './auth.service'

/**
 * Lista las reseñas de una propiedad con la valoración media y el total.
 */
export async function listReviewsByProperty(propertyId: string) {
  const property = await propertyRepository.getById(propertyId)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')

  const items = await reviewRepository.listByProperty(propertyId)
  const averageRating = await reviewRepository.getAverageRating(propertyId)
  return { items, averageRating, total: items.length }
}

async function userHasCompletedBooking(userId: string, propertyId: string): Promise<boolean> {
  const bookings = (await bookingRepository.listByUser(userId)).filter((b) => b.propertyId === propertyId)
  return bookings.some((b) => isBookingCompleted(b))
}

/**
 * Crea una reseña para una propiedad. El usuario debe tener una reserva completada y no tener ya una reseña.
 */
export async function createReview(userId: string, input: {
  propertyId: string
  rating: number
  comment: string
  ratingDetails?: RatingBreakdown
}) {
  const propertyId = String(input.propertyId || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  const property = await propertyRepository.getById(propertyId)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')

  if (!(await userHasCompletedBooking(userId, propertyId))) {
    // En Postman se permite 201/400/404 (no 403). Tratamos este caso como validación de negocio.
    throw httpError(400, 'FORBIDDEN', 'Only users with a completed booking can review')
  }

  const existing = await reviewRepository.findByPropertyAndUser(propertyId, userId)
  if (existing) throw httpError(409, 'REVIEW_ALREADY_EXISTS', 'Review already exists')

  const rating = Math.trunc(Number(input.rating))
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw httpError(400, 'VALIDATION_ERROR', 'rating must be between 1 and 5')
  }

  const comment = String(input.comment || '').trim()
  if (!comment) throw httpError(400, 'VALIDATION_ERROR', 'comment is required')

  const user = await findUserById(userId)
  if (!user) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const review = await reviewRepository.create({
    propertyId,
    userId,
    rating,
    ratingDetails: input.ratingDetails,
    comment,
    date: new Date().toISOString(),
    userName: user.fullName,
    userAvatar: user.avatarUrl ?? '',
  })

  if (property.hostId && property.hostId !== userId) {
    await createNotification({
      userId: property.hostId,
      type: 'new_review',
      title: 'Nueva review',
      message: `Nueva review en "${property.title}" (${rating}/5).`,
      link: `/properties/${propertyId}`,
    })
  }

  return review
}

/**
 * Obtiene una reseña por id; si no existe lanza 404.
 */
export async function getReviewByIdOrThrow(id: string) {
  const review = await reviewRepository.findById(id)
  if (!review) throw httpError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return review
}

/**
 * Actualiza rating y/o comment de una reseña. Solo el autor puede actualizarla.
 */
export async function updateReview(
  userId: string,
  reviewId: string,
  patch: Partial<Pick<Review, 'rating' | 'comment'>>,
  opts?: { isAdmin?: boolean }
) {
  const current = await getReviewByIdOrThrow(reviewId)
  const isAdmin = Boolean(opts?.isAdmin)
  if (!isAdmin && current.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  const next: Partial<Pick<Review, 'rating' | 'comment' | 'date'>> = {}
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

  const updated = await reviewRepository.update(reviewId, next)
  if (!updated) throw httpError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return updated
}

/**
 * Elimina una reseña. Solo el autor puede eliminarla.
 */
export async function deleteReview(userId: string, reviewId: string, opts?: { isAdmin?: boolean }) {
  const current = await getReviewByIdOrThrow(reviewId)
  const isAdmin = Boolean(opts?.isAdmin)
  if (!isAdmin && current.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')
  await reviewRepository.delete(reviewId)
  return true
}
