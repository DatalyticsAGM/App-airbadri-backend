import {
  memoryCreateBooking,
  memoryGetBookingById,
  memoryListBookingsByUser,
  memoryListBookingsByProperty,
  memoryUpdateBookingStatus,
  memoryDeleteBookingsByProperty,
  memoryResetForDev,
} from '../../store/memoryBookings'
import type { IBookingRepository } from '../types'

export function createMemoryBookingRepository(): IBookingRepository {
  return {
    async create(params) {
      return memoryCreateBooking(params)
    },
    async getById(id: string) {
      return memoryGetBookingById(id)
    },
    async listByUser(userId: string) {
      return memoryListBookingsByUser(userId)
    },
    async listByProperty(propertyId: string) {
      return memoryListBookingsByProperty(propertyId)
    },
    async updateStatus(id: string, status) {
      return memoryUpdateBookingStatus(id, status)
    },
    async deleteByProperty(propertyId: string) {
      return memoryDeleteBookingsByProperty(propertyId)
    },
  }
}

export function getMemoryBookingReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
