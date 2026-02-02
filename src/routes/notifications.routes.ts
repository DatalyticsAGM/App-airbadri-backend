import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import {
  createMyNotificationHandler,
  listMyNotificationsHandler,
  markAllAsReadHandler,
  markAsReadHandler,
  unreadCountHandler,
} from '../controllers/notifications.controller'

export function notificationsRoutes() {
  const router = Router()

  router.get('/', requireAuth, asyncHandler(listMyNotificationsHandler))
  router.get('/unread-count', requireAuth, asyncHandler(unreadCountHandler))
  router.post('/', requireAuth, asyncHandler(createMyNotificationHandler))
  router.post('/read-all', requireAuth, asyncHandler(markAllAsReadHandler))
  router.patch('/:id/read', requireAuth, asyncHandler(markAsReadHandler))

  return router
}

