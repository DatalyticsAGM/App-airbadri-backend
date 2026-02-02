import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import {
  createReview,
  deleteReview,
  listReviewsByProperty,
  updateReview,
} from '../services/reviews.service'

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

export async function listPropertyReviewsHandler(req: Request, res: Response) {
  const propertyId = String(req.params?.id || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  res.json(listReviewsByProperty(propertyId))
}

export async function createPropertyReviewHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const propertyId = String(req.params?.id || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  const rating = Number(req.body?.rating)
  const comment = String(req.body?.comment || '')

  const review = await createReview(userId, { propertyId, rating, comment, ratingDetails: req.body?.ratingDetails })
  res.status(201).json(review)
}

export async function updateReviewHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  const updated = updateReview(userId, id, { rating: req.body?.rating, comment: req.body?.comment })
  res.json(updated)
}

export async function deleteReviewHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  deleteReview(userId, id)
  res.json({ ok: true })
}

