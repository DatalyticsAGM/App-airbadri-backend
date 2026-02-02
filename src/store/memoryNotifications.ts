import crypto from 'crypto'

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'new_review'
  | 'info'
  | 'other'

export type Notification = {
  id: string
  userId: string
  type: NotificationType | string
  title: string
  message: string
  read: boolean
  date: string // ISO string
  link?: string
  createdAt: Date
  updatedAt: Date
}

const notificationsById = new Map<string, Notification>()

function now() {
  return new Date()
}

export function memoryGetNotificationsByUser(userId: string) {
  return Array.from(notificationsById.values())
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function memoryCreateNotification(params: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>) {
  const t = now()
  const id = crypto.randomUUID()
  const notification: Notification = { id, ...params, createdAt: t, updatedAt: t }
  notificationsById.set(id, notification)
  return notification
}

export function memoryMarkAsRead(userId: string, id: string) {
  const current = notificationsById.get(id)
  if (!current) return null
  if (current.userId !== userId) return null
  const updated: Notification = { ...current, read: true, updatedAt: now() }
  notificationsById.set(id, updated)
  return updated
}

export function memoryMarkAllAsRead(userId: string) {
  let count = 0
  for (const n of notificationsById.values()) {
    if (n.userId !== userId) continue
    if (n.read) continue
    notificationsById.set(n.id, { ...n, read: true, updatedAt: now() })
    count++
  }
  return count
}

export function memoryGetUnreadCount(userId: string) {
  return memoryGetNotificationsByUser(userId).filter((n) => !n.read).length
}

