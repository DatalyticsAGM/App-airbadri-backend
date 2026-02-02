import { httpError } from '../middlewares/errorHandler'
import {
  memoryCreateNotification,
  memoryGetNotificationsByUser,
  memoryGetUnreadCount,
  memoryMarkAllAsRead,
  memoryMarkAsRead,
  type Notification,
  type NotificationType,
} from '../store/memoryNotifications'

export function getMyNotifications(userId: string) {
  return memoryGetNotificationsByUser(userId)
}

export function getUnreadCount(userId: string) {
  return memoryGetUnreadCount(userId)
}

export function createNotification(params: {
  userId: string
  type: NotificationType | string
  title: string
  message: string
  link?: string
}): Notification {
  const title = String(params.title || '').trim()
  const message = String(params.message || '').trim()
  if (!title) throw httpError(400, 'VALIDATION_ERROR', 'title is required')
  if (!message) throw httpError(400, 'VALIDATION_ERROR', 'message is required')

  return memoryCreateNotification({
    userId: params.userId,
    type: params.type,
    title,
    message,
    read: false,
    date: new Date().toISOString(),
    link: params.link,
  })
}

export function markAsRead(userId: string, notificationId: string) {
  const updated = memoryMarkAsRead(userId, notificationId)
  if (!updated) throw httpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found')
  return updated
}

export function markAllAsRead(userId: string) {
  const count = memoryMarkAllAsRead(userId)
  return { ok: true, count }
}

