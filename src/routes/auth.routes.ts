import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import {
  forgotPassword,
  login,
  logout,
  me,
  resetPasswordWithToken,
  signup,
  validateResetToken,
} from '../controllers/auth.controller'

export function authRoutes() {
  const router = Router()

  router.post('/signup', asyncHandler(signup))
  router.post('/login', asyncHandler(login))
  router.get('/me', requireAuth, asyncHandler(me))
  router.post('/logout', requireAuth, asyncHandler(logout))

  router.post('/forgot-password', asyncHandler(forgotPassword))
  router.get('/reset-password/validate', asyncHandler(validateResetToken))
  router.post('/reset-password', asyncHandler(resetPasswordWithToken))

  return router
}

