/**
 * Contratos (interfaces) de los repositorios de datos.
 * Todas las operaciones son async (Promise) para compatibilidad con MongoDB.
 * Los tipos de dominio (Property, Booking, etc.) se importan de los stores existentes.
 */

import type { Property } from '../store/memoryProperties'
import type { Booking, BookingStatus } from '../store/memoryBookings'
import type { Review } from '../store/memoryReviews'
import type { Favorite } from '../store/memoryFavorites'
import type { Notification } from '../store/memoryNotifications'
import type { SearchHistoryEntry } from '../store/memorySearchHistory'

/** Usuario en forma unificada para servicios: siempre tiene id (string) y role. */
export type UserForService = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  role: string
  passwordHash: string
  resetPasswordTokenHash?: string
  resetPasswordExpiresAt?: Date
}

export interface IUserRepository {
  create(params: { fullName: string; email: string; passwordHash: string; role?: string }): Promise<UserForService>
  findByEmail(email: string): Promise<UserForService | null>
  findById(id: string): Promise<UserForService | null>
  update(userId: string, patch: { fullName?: string; email?: string; avatarUrl?: string; role?: string }): Promise<UserForService | null>
  delete(userId: string): Promise<boolean>
  setResetPasswordToken(userId: string, token: string, expiresAt: Date): Promise<void>
  findByValidResetToken(token: string): Promise<UserForService | null>
  resetPassword(userId: string, newPasswordHash: string): Promise<void>
}

export interface IPropertyRepository {
  list(): Promise<Property[]>
  getById(id: string): Promise<Property | null>
  listByHost(hostId: string): Promise<Property[]>
  create(params: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property>
  update(id: string, patch: Partial<Omit<Property, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>): Promise<Property | null>
  delete(id: string): Promise<boolean>
}

export interface IBookingRepository {
  create(params: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking>
  getById(id: string): Promise<Booking | null>
  listByUser(userId: string): Promise<Booking[]>
  listByProperty(propertyId: string): Promise<Booking[]>
  updateStatus(id: string, status: BookingStatus): Promise<Booking | null>
  deleteByProperty(propertyId: string): Promise<number>
}

export interface IReviewRepository {
  listByProperty(propertyId: string): Promise<Review[]>
  findById(id: string): Promise<Review | null>
  findByPropertyAndUser(propertyId: string, userId: string): Promise<Review | null>
  create(params: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review>
  update(id: string, patch: Partial<Pick<Review, 'rating' | 'ratingDetails' | 'comment' | 'date'>>): Promise<Review | null>
  delete(id: string): Promise<boolean>
  getAverageRating(propertyId: string): Promise<number>
}

export interface IFavoriteRepository {
  getByUser(userId: string): Promise<Favorite[]>
  isFavorite(userId: string, propertyId: string): Promise<boolean>
  add(userId: string, propertyId: string): Promise<Favorite>
  remove(userId: string, propertyId: string): Promise<boolean>
}

export interface INotificationRepository {
  getByUser(userId: string): Promise<Notification[]>
  create(params: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification>
  markAsRead(userId: string, id: string): Promise<Notification | null>
  markAllAsRead(userId: string): Promise<number>
  getUnreadCount(userId: string): Promise<number>
}

export interface ISearchHistoryRepository {
  get(userId: string): Promise<SearchHistoryEntry[]>
  add(userId: string, entry: Omit<SearchHistoryEntry, 'date'>): Promise<SearchHistoryEntry[]>
  clear(userId: string): Promise<void>
}

/** Solo para adapters de memoria: reset en desarrollo. No se expone en la interfaz pública de producción. */
export interface IMemoryReset {
  resetForDev(): void
}
