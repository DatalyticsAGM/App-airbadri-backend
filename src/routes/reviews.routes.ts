import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import { deleteReviewHandler, updateReviewHandler } from '../controllers/reviews.controller'

export function reviewsRoutes() {
  const router = Router()

  router.patch('/:id', requireAuth, asyncHandler(updateReviewHandler))
  router.delete('/:id', requireAuth, asyncHandler(deleteReviewHandler))

  return router
}

