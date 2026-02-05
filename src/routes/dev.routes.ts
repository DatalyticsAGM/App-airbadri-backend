import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAdmin, requireAuth } from '../middlewares/auth'
import { runSeed } from '../dev/seed'

export function devRoutes() {
  const router = Router()

  router.post('/seed', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const result = await runSeed()
    res.status(200).json(result)
  }))

  return router
}
