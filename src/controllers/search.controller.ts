import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { memoryListProperties } from '../store/memoryProperties'
import {
  memoryAddSearchHistory,
  memoryClearSearchHistory,
  memoryGetSearchHistory,
} from '../store/memorySearchHistory'

const SUGGESTIONS_LIMIT = 15

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

export async function getSuggestionsHandler(req: Request, res: Response) {
  const q = String(req.query?.q || '').trim().toLowerCase()
  const properties = memoryListProperties()
  const locations = new Set<string>()
  for (const p of properties) {
    if (p.location && (!q || p.location.toLowerCase().includes(q))) {
      locations.add(p.location)
    }
  }
  const suggestions = Array.from(locations)
    .slice(0, SUGGESTIONS_LIMIT)
    .sort((a, b) => a.localeCompare(b))
  res.json({ suggestions })
}

export async function getSearchHistoryHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const items = memoryGetSearchHistory(userId)
  res.json({ items })
}

export async function postSearchHistoryHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const body = req.body || {}
  const entry = {
    query: typeof body.q === 'string' ? body.q.trim() : undefined,
    location: typeof body.location === 'string' ? body.location.trim() : undefined,
    minPrice: typeof body.minPrice === 'number' ? body.minPrice : undefined,
    maxPrice: typeof body.maxPrice === 'number' ? body.maxPrice : undefined,
    checkIn: typeof body.checkIn === 'string' ? body.checkIn.trim() : undefined,
    checkOut: typeof body.checkOut === 'string' ? body.checkOut.trim() : undefined,
  }
  memoryAddSearchHistory(userId, entry)
  res.status(201).json({ ok: true, items: memoryGetSearchHistory(userId) })
}

export async function deleteSearchHistoryHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  memoryClearSearchHistory(userId)
  res.json({ ok: true })
}
