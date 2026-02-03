/**
 * Módulo favorites.service (servicio de favoritos).
 *
 * Lógica de negocio para listar, añadir y quitar favoritos de un usuario.
 * Usa repositorios (memoria o MongoDB) y valida que la propiedad exista.
 */
import { httpError } from '../middlewares/errorHandler'
import { propertyRepository, favoriteRepository } from '../repositories'

/**
 * Devuelve la lista de favoritos del usuario.
 */
export async function getFavoritesByUser(userId: string) {
  return favoriteRepository.getByUser(userId)
}

/**
 * Añade una propiedad a los favoritos del usuario. La propiedad debe existir.
 */
export async function addFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  const property = await propertyRepository.getById(id)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return favoriteRepository.add(userId, id)
}

/**
 * Quita una propiedad de los favoritos del usuario.
 */
export async function removeFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  await favoriteRepository.remove(userId, id)
  return { ok: true }
}

/**
 * Comprueba si una propiedad está en los favoritos del usuario.
 */
export async function isFavorite(userId: string, propertyId: string) {
  const id = String(propertyId || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')
  const favorite = await favoriteRepository.isFavorite(userId, id)
  return { favorite }
}
