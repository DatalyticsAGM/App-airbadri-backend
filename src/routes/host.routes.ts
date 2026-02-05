import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import { hostDashboardHandler } from '../controllers/host.controller'

export function hostRoutes() {
  const router = Router()

  // Permite ver estadísticas propias aunque aún no tenga propiedades.
  router.get('/dashboard', requireAuth, asyncHandler(hostDashboardHandler))

  return router
}

