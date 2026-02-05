import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import {
  createBookingHandler,
  getMyBookingHandler,
  listBookingsByPropertyHandler,
  listMyBookingsHandler,
  patchBookingHandler,
} from '../controllers/bookings.controller'

export function bookingsRoutes() {
  const router = Router()

  router.get('/', requireAuth, asyncHandler(listMyBookingsHandler))
  router.get('/property/:propertyId', asyncHandler(listBookingsByPropertyHandler))
  router.get('/:id', requireAuth, asyncHandler(getMyBookingHandler))
  router.post('/', requireAuth, asyncHandler(createBookingHandler))
  router.patch('/:id', requireAuth, asyncHandler(patchBookingHandler))

  return router
}

