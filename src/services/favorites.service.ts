/**
 * Módulo favorites.service (servicio de favoritos).
 *
 * Lógica de negocio para listar, añadir y quitar favoritos de un usuario.
 * Usa el store en memoria (memoryFavorites) y valida que la propiedad exista (memoryProperties).
 * Dependencias: middlewares/errorHandler, store/memoryFavorites, store/memoryProperties.
 */
import { httpError } from '../middlewares/errorHandler'
import { memoryGetPropertyById } from '../store/memoryProperties'
import {
  memoryAddFavorite,
  memoryGetFavoritesByUser,
  memoryIsFavorite,
  memoryRemoveFavorite,
} from '../store/memoryFavorites'

/**
 * Devuelve la lista de propiedades marcadas como favoritas por el usuario.
 *
 * @param userId - Id del usuario.
 * @returns Lista de propiedades favoritas (del store en memoria).
 */
export function getFavoritesByUser(userId: string) {
  return memoryGetFavoritesByUser(userId)
}

/**
 * Añade una propiedad a los favoritos del usuario. La propiedad debe existir.
 *
 * @param userId - Id del usuario.
 * @param propertyId - Id de la propiedad.
 * @returns La lista actualizada de favoritos del usuario.
 * @throws httpError 400 si propertyId está vacío; 404 si la propiedad no existe.
 *
 * @example
 * const favorites = addFavorite('user-1', 'prop-1')
 */
export function addFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  const property = memoryGetPropertyById(id)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return memoryAddFavorite(userId, id)
}

/**
 * Quita una propiedad de los favoritos del usuario.
 *
 * @param userId - Id del usuario.
 * @param propertyId - Id de la propiedad.
 * @returns { ok: true }.
 * @throws httpError 400 si propertyId está vacío.
 */
export function removeFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  memoryRemoveFavorite(userId, id)
  return { ok: true }
}

/**
 * Comprueba si una propiedad está en los favoritos del usuario.
 *
 * @param userId - Id del usuario.
 * @param propertyId - Id de la propiedad.
 * @returns { favorite: boolean }.
 * @throws httpError 400 si propertyId está vacío.
 */
export function isFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  return { favorite: memoryIsFavorite(userId, id) }
}

