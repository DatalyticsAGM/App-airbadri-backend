import {
  memoryGetFavoritesByUser,
  memoryIsFavorite,
  memoryAddFavorite,
  memoryRemoveFavorite,
  memoryResetForDev,
} from '../../store/memoryFavorites'
import type { IFavoriteRepository } from '../types'

export function createMemoryFavoriteRepository(): IFavoriteRepository {
  return {
    async getByUser(userId: string) {
      return memoryGetFavoritesByUser(userId)
    },
    async isFavorite(userId: string, propertyId: string) {
      return memoryIsFavorite(userId, propertyId)
    },
    async add(userId: string, propertyId: string) {
      return memoryAddFavorite(userId, propertyId)
    },
    async remove(userId: string, propertyId: string) {
      return memoryRemoveFavorite(userId, propertyId)
    },
  }
}

export function getMemoryFavoriteReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
