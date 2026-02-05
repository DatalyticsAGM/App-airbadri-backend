import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import { deleteReviewHandler, listReviewsByPropertyHandler, updateReviewHandler } from '../controllers/reviews.controller'

export function reviewsRoutes() {
  const router = Router()

  router.get('/property/:propertyId', asyncHandler(listReviewsByPropertyHandler))
  router.patch('/:id', requireAuth, asyncHandler(updateReviewHandler))
  router.delete('/:id', requireAuth, asyncHandler(deleteReviewHandler))

  return router
}

