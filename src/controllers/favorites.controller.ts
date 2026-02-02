import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { addFavorite, getFavoritesByUser, isFavorite, removeFavorite } from '../services/favorites.service'

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

export async function listMyFavoritesHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  res.json({ items: getFavoritesByUser(userId) })
}

export async function addFavoriteHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const propertyId = String(req.body?.propertyId || '').trim()
  const fav = addFavorite(userId, propertyId)
  res.status(201).json(fav)
}

export async function removeFavoriteHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const propertyId = String(req.params?.propertyId || '').trim()
  res.json(removeFavorite(userId, propertyId))
}

export async function isFavoriteHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const propertyId = String(req.params?.propertyId || '').trim()
  res.json(isFavorite(userId, propertyId))
}

