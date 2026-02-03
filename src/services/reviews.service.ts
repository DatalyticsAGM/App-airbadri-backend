/**
 * Módulo reviews.service (servicio de reseñas).
 *
 * Lógica de negocio de reseñas: listar por propiedad, crear (solo con reserva completada),
 * actualizar y eliminar. Usa stores en memoria (memoryReviews, memoryProperties, memoryBookings)
 * y notifica al host vía notifications.service. Dependencias: middlewares/errorHandler,
 * store/memoryReviews, store/memoryProperties, store/memoryBookings, bookings.service,
 * notifications.service, auth.service.
 */
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
  type RatingBreakdown,
  type Review,
} from '../store/memoryReviews'
import { findUserById } from './auth.service'

/**
 * Lista las reseñas de una propiedad con la valoración media y el total.
 *
 * @param propertyId - Id de la propiedad.
 * @returns { items, averageRating, total }.
 * @throws httpError 404 si la propiedad no existe.
 */
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

/**
 * Crea una reseña para una propiedad. El usuario debe tener una reserva completada en esa propiedad y no tener ya una reseña.
 * Notifica al host. Obtiene nombre y avatar del usuario desde auth.service.
 *
 * @param userId - Id del usuario que escribe la reseña.
 * @param input - propertyId, rating (1-5), comment y opcionalmente ratingDetails.
 * @returns La reseña creada.
 * @throws httpError 400 por validación (propertyId, rating, comment); 404 propiedad no encontrada; 403 sin reserva completada; 409 ya existe reseña; 401 usuario no encontrado.
 *
 * @example
 * const review = await createReview('user-1', { propertyId: 'p1', rating: 5, comment: 'Excelente estancia' })
 */
export async function createReview(userId: string, input: {
  propertyId: string
  rating: number
  comment: string
  ratingDetails?: RatingBreakdown
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
  const userAvatar = 'avatarUrl' in user ? user.avatarUrl ?? '' : ''

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

/**
 * Obtiene una reseña por id; si no existe lanza 404.
 *
 * @param id - Id de la reseña.
 * @returns La reseña.
 * @throws httpError 404 si no existe.
 */
export function getReviewByIdOrThrow(id: string) {
  const review = memoryFindReviewById(id)
  if (!review) throw httpError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return review
}

/**
 * Actualiza rating y/o comment de una reseña. Solo el autor puede actualizarla.
 *
 * @param userId - Id del usuario (debe ser el autor de la reseña).
 * @param reviewId - Id de la reseña.
 * @param patch - rating (1-5) y/o comment a actualizar.
 * @returns La reseña actualizada (con date actualizado).
 * @throws httpError 403 si no es el autor; 404 si no existe; 400 por validación.
 */
export function updateReview(userId: string, reviewId: string, patch: Partial<Pick<Review, 'rating' | 'comment'>>) {
  const current = getReviewByIdOrThrow(reviewId)
  if (current.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

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

  const updated = memoryUpdateReview(reviewId, next)
  if (!updated) throw httpError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return updated
}

/**
 * Elimina una reseña. Solo el autor puede eliminarla.
 *
 * @param userId - Id del usuario (debe ser el autor).
 * @param reviewId - Id de la reseña.
 * @returns true.
 * @throws httpError 403 si no es el autor; 404 si no existe (getReviewByIdOrThrow).
 */
export function deleteReview(userId: string, reviewId: string) {
  const current = getReviewByIdOrThrow(reviewId)
  if (current.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')
  memoryDeleteReview(reviewId)
  return true
}

