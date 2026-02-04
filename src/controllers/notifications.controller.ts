import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import {
  createNotification,
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../services/notifications.service'

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

export async function listMyNotificationsHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const items = await getMyNotifications(userId)
  res.json({ items })
}

export async function unreadCountHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const unread = await getUnreadCount(userId)
  res.json({ unread })
}

export async function markAsReadHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')
  const result = await markAsRead(userId, id)
  res.json(result)
}

export async function markAllAsReadHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const result = await markAllAsRead(userId)
  res.json(result)
}

// Endpoint MOCK útil para testing manual (crear notificación “a mano”).
export async function createMyNotificationHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const type = String(req.body?.type || 'info')
  const title = String(req.body?.title || '')
  const message = String(req.body?.message || '')
  const link = req.body?.link ? String(req.body.link) : undefined

  const n = await createNotification({ userId, type, title, message, link })
  res.status(201).json(n)
}

