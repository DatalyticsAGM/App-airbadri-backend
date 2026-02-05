import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth, requireHostOrAdmin } from '../middlewares/auth'
import {
  createPropertyHandler,
  deletePropertyHandler,
  getAvailabilityHandler,
  getBookingPreviewHandler,
  getPropertyHandler,
  listMineHandler,
  listPropertiesHandler,
  updatePropertyHandler,
} from '../controllers/properties.controller'
import { createPropertyReviewHandler, listPropertyReviewsHandler } from '../controllers/reviews.controller'

export function propertiesRoutes() {
  const router = Router()

  router.get('/', asyncHandler(listPropertiesHandler))
  router.get('/mine', requireAuth, requireHostOrAdmin, asyncHandler(listMineHandler))
  router.get('/:id/availability', asyncHandler(getAvailabilityHandler))
  router.get('/:id/booking-preview', asyncHandler(getBookingPreviewHandler))
  router.get('/:id/reviews', asyncHandler(listPropertyReviewsHandler))
  router.get('/:id', asyncHandler(getPropertyHandler))

  router.post('/', requireAuth, requireHostOrAdmin, asyncHandler(createPropertyHandler))
  router.post('/:id/reviews', requireAuth, asyncHandler(createPropertyReviewHandler))
  router.patch('/:id', requireAuth, requireHostOrAdmin, asyncHandler(updatePropertyHandler))
  router.delete('/:id', requireAuth, requireHostOrAdmin, asyncHandler(deletePropertyHandler))

  return router
}

