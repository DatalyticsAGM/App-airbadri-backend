import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import { deleteMe, getMe, updateMe } from '../controllers/user.controller'

export function usersRoutes() {
  const router = Router()

  router.get('/me', requireAuth, asyncHandler(getMe))
  router.patch('/me', requireAuth, asyncHandler(updateMe))
  router.delete('/me', requireAuth, asyncHandler(deleteMe))

  return router
}

