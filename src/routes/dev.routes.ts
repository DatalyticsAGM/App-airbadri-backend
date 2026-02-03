import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { runSeed } from '../dev/seed'

export function devRoutes() {
  const router = Router()

  router.post('/seed', asyncHandler(async (_req, res) => {
    const result = await runSeed()
    res.status(200).json(result)
  }))

  return router
}
