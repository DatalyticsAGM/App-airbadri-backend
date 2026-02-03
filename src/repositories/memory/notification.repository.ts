import {
  memoryGetNotificationsByUser,
  memoryCreateNotification,
  memoryMarkAsRead,
  memoryMarkAllAsRead,
  memoryGetUnreadCount,
  memoryResetForDev,
} from '../../store/memoryNotifications'
import type { INotificationRepository } from '../types'

export function createMemoryNotificationRepository(): INotificationRepository {
  return {
    async getByUser(userId: string) {
      return memoryGetNotificationsByUser(userId)
    },
    async create(params) {
      return memoryCreateNotification(params)
    },
    async markAsRead(userId: string, id: string) {
      return memoryMarkAsRead(userId, id)
    },
    async markAllAsRead(userId: string) {
      return memoryMarkAllAsRead(userId)
    },
    async getUnreadCount(userId: string) {
      return memoryGetUnreadCount(userId)
    },
  }
}

export function getMemoryNotificationReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
