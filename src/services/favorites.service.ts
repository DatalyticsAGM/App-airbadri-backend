import { httpError } from '../middlewares/errorHandler'
import { memoryGetPropertyById } from '../store/memoryProperties'
import {
  memoryAddFavorite,
  memoryGetFavoritesByUser,
  memoryIsFavorite,
  memoryRemoveFavorite,
} from '../store/memoryFavorites'

export function getFavoritesByUser(userId: string) {
  return memoryGetFavoritesByUser(userId)
}

export function addFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  const property = memoryGetPropertyById(id)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return memoryAddFavorite(userId, id)
}

export function removeFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  memoryRemoveFavorite(userId, id)
  return { ok: true }
}

export function isFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  return { favorite: memoryIsFavorite(userId, id) }
}

