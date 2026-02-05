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
  // Cualquier usuario autenticado puede ver "mis propiedades" (si no tiene, devuelve lista vacía).
  router.get('/mine', requireAuth, asyncHandler(listMineHandler))
  router.get('/:id/availability', asyncHandler(getAvailabilityHandler))
  router.get('/:id/booking-preview', asyncHandler(getBookingPreviewHandler))
  router.get('/:id/reviews', asyncHandler(listPropertyReviewsHandler))
  router.get('/:id', asyncHandler(getPropertyHandler))

  // Un usuario normal puede crear su primera propiedad; el sistema lo promueve a host.
  router.post('/', requireAuth, asyncHandler(createPropertyHandler))
  router.post('/:id/reviews', requireAuth, asyncHandler(createPropertyReviewHandler))
  router.patch('/:id', requireAuth, requireHostOrAdmin, asyncHandler(updatePropertyHandler))
  router.delete('/:id', requireAuth, requireHostOrAdmin, asyncHandler(deletePropertyHandler))

  return router
}

