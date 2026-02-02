import crypto from 'crypto'

export type Favorite = {
  id: string
  userId: string
  propertyId: string
  date: string // ISO string
}

const favoritesByUser = new Map<string, Map<string, Favorite>>() // userId -> propertyId -> favorite

export function memoryGetFavoritesByUser(userId: string) {
  const map = favoritesByUser.get(userId)
  if (!map) return []
  return Array.from(map.values())
}

export function memoryIsFavorite(userId: string, propertyId: string) {
  const map = favoritesByUser.get(userId)
  return Boolean(map?.has(propertyId))
}

export function memoryAddFavorite(userId: string, propertyId: string) {
  const map = favoritesByUser.get(userId) || new Map<string, Favorite>()
  favoritesByUser.set(userId, map)

  const existing = map.get(propertyId)
  if (existing) return existing

  const fav: Favorite = {
    id: crypto.randomUUID(),
    userId,
    propertyId,
    date: new Date().toISOString(),
  }

  map.set(propertyId, fav)
  return fav
}

export function memoryRemoveFavorite(userId: string, propertyId: string) {
  const map = favoritesByUser.get(userId)
  if (!map) return false
  return map.delete(propertyId)
}

