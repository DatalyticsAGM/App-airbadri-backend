import { Router } from 'express'

import { asyncHandler } from '../middlewares/asyncHandler'
import { requireAuth } from '../middlewares/auth'
import {
  deleteSearchHistoryHandler,
  getSearchHistoryHandler,
  getSuggestionsHandler,
  postSearchHistoryHandler,
} from '../controllers/search.controller'

export function searchRoutes() {
  const router = Router()

  router.get('/suggestions', asyncHandler(getSuggestionsHandler))
  router.get('/history', requireAuth, asyncHandler(getSearchHistoryHandler))
  router.post('/history', requireAuth, asyncHandler(postSearchHistoryHandler))
  router.delete('/history', requireAuth, asyncHandler(deleteSearchHistoryHandler))

  return router
}
