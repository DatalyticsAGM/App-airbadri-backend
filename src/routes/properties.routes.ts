import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import {
  createPropertyHandler,
  deletePropertyHandler,
  getAvailabilityHandler,
  getPropertyHandler,
  listMineHandler,
  listPropertiesHandler,
  updatePropertyHandler,
} from '../controllers/properties.controller'
import { createPropertyReviewHandler, listPropertyReviewsHandler } from '../controllers/reviews.controller'

export function propertiesRoutes() {
  const router = Router()

  router.get('/', asyncHandler(listPropertiesHandler))
  router.get('/mine', requireAuth, asyncHandler(listMineHandler))
  router.get('/:id/availability', asyncHandler(getAvailabilityHandler))
  router.get('/:id/reviews', asyncHandler(listPropertyReviewsHandler))
  router.get('/:id', asyncHandler(getPropertyHandler))

  router.post('/', requireAuth, asyncHandler(createPropertyHandler))
  router.post('/:id/reviews', requireAuth, asyncHandler(createPropertyReviewHandler))
  router.patch('/:id', requireAuth, asyncHandler(updatePropertyHandler))
  router.delete('/:id', requireAuth, asyncHandler(deletePropertyHandler))

  return router
}

