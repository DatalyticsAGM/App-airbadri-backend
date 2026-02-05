import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth, requireHostOrAdmin } from '../middlewares/auth'
import { hostDashboardHandler } from '../controllers/host.controller'

export function hostRoutes() {
  const router = Router()

  router.get('/dashboard', requireAuth, requireHostOrAdmin, asyncHandler(hostDashboardHandler))

  return router
}

