/**
 * Punto único de decisión: exporta repositorios de memoria o de MongoDB.
 * Se carga después de connectDb en server.ts (dynamic import de app), por tanto
 * con MongoDB configurado mongoose ya está conectado y se usan los repos Mongo.
 */
import mongoose from 'mongoose'

import { env } from '../config/env'
import { createUserRepository as createMongoUserRepo } from './mongo/user.repository'
import { createPropertyRepository as createMongoPropertyRepo } from './mongo/property.repository'
import { createBookingRepository as createMongoBookingRepo } from './mongo/booking.repository'
import { createReviewRepository as createMongoReviewRepo } from './mongo/review.repository'
import { createFavoriteRepository as createMongoFavoriteRepo } from './mongo/favorite.repository'
import { createNotificationRepository as createMongoNotificationRepo } from './mongo/notification.repository'
import { createSearchHistoryRepository as createMongoSearchHistoryRepo } from './mongo/searchHistory.repository'
import { createMemoryUserRepository, getMemoryUserReset } from './memory/user.repository'
import { createMemoryPropertyRepository, getMemoryPropertyReset } from './memory/property.repository'
import { createMemoryBookingRepository, getMemoryBookingReset } from './memory/booking.repository'
import { createMemoryReviewRepository, getMemoryReviewReset } from './memory/review.repository'
import { createMemoryFavoriteRepository, getMemoryFavoriteReset } from './memory/favorite.repository'
import { createMemoryNotificationRepository, getMemoryNotificationReset } from './memory/notification.repository'
import { createMemorySearchHistoryRepository, getMemorySearchHistoryReset } from './memory/searchHistory.repository'
import type { IUserRepository, IPropertyRepository, IBookingRepository, IReviewRepository, IFavoriteRepository, INotificationRepository, ISearchHistoryRepository } from './types'

function useMemory(): boolean {
  if (env.USE_MEMORY_ONLY) return true
  return mongoose.connection.readyState !== 1
}

const memory = useMemory()

export const userRepository: IUserRepository = memory ? createMemoryUserRepository() : createMongoUserRepo()
export const propertyRepository: IPropertyRepository = memory ? createMemoryPropertyRepository() : createMongoPropertyRepo()
export const bookingRepository: IBookingRepository = memory ? createMemoryBookingRepository() : createMongoBookingRepo()
export const reviewRepository: IReviewRepository = memory ? createMemoryReviewRepository() : createMongoReviewRepo()
export const favoriteRepository: IFavoriteRepository = memory ? createMemoryFavoriteRepository() : createMongoFavoriteRepo()
export const notificationRepository: INotificationRepository = memory ? createMemoryNotificationRepository() : createMongoNotificationRepo()
export const searchHistoryRepository: ISearchHistoryRepository = memory
  ? createMemorySearchHistoryRepository()
  : createMongoSearchHistoryRepo()

/** Solo para seed en modo memoria: resetea todos los stores en memoria. */
export function resetAllMemoryForDev(): void {
  if (!memory) return
  getMemoryBookingReset().resetForDev()
  getMemoryReviewReset().resetForDev()
  getMemoryFavoriteReset().resetForDev()
  getMemoryNotificationReset().resetForDev()
  getMemorySearchHistoryReset().resetForDev()
  getMemoryPropertyReset().resetForDev()
  getMemoryUserReset().resetForDev()
}

export function isUsingMemory(): boolean {
  return memory
}
