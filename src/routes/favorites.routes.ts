import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import {
  addFavoriteHandler,
  isFavoriteHandler,
  listMyFavoritesHandler,
  removeFavoriteHandler,
} from '../controllers/favorites.controller'

export function favoritesRoutes() {
  const router = Router()

  router.get('/', requireAuth, asyncHandler(listMyFavoritesHandler))
  router.post('/', requireAuth, asyncHandler(addFavoriteHandler))
  router.get('/:propertyId', requireAuth, asyncHandler(isFavoriteHandler))
  router.delete('/:propertyId', requireAuth, asyncHandler(removeFavoriteHandler))

  return router
}

