import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import {
  cancelMyBooking,
  createBooking,
  getMyBookingByIdOrThrow,
  listBookingsByProperty,
  listMyBookings,
  normalizeBookingStatus,
} from '../services/bookings.service'

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

export async function listMyBookingsHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const list = await listMyBookings(userId)
  const items = list.map((b) => ({ ...b, status: normalizeBookingStatus(b) }))
  res.json({ items })
}

export async function getMyBookingHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')
  const isAdmin = String((req as any).userRole || 'user') === 'admin'

  const include = String(req.query?.include || '').trim().toLowerCase()
  const withProperty = include === 'property'

  const booking = await getMyBookingByIdOrThrow(userId, id, { isAdmin })
  const payload: Record<string, unknown> = { ...booking, status: normalizeBookingStatus(booking) }
  if (withProperty) {
    const { getPropertyByIdOrThrow } = await import('../services/properties.service')
    try {
      payload.property = await getPropertyByIdOrThrow(booking.propertyId)
    } catch {
      payload.property = null
    }
  }
  res.json(payload)
}

export async function createBookingHandler(req: Request, res: Response) {
  const userId = requireUserId(req)

  const propertyId = String(req.body?.propertyId || '').trim()
  const checkIn = String(req.body?.checkIn || '').trim()
  const checkOut = String(req.body?.checkOut || '').trim()
  const guests = Number(req.body?.guests)

  const booking = await createBooking(userId, { propertyId, checkIn, checkOut, guests })
  res.status(201).json({ ...booking, status: normalizeBookingStatus(booking) })
}

export async function patchBookingHandler(req: Request, res: Response) {
  const userId = requireUserId(req)
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')
  const isAdmin = String((req as any).userRole || 'user') === 'admin'

  const status = String(req.body?.status || '').trim()
  if (status !== 'cancelled') {
    throw httpError(400, 'VALIDATION_ERROR', 'Only status=cancelled is supported')
  }

  const updated = await cancelMyBooking(userId, id, { isAdmin })
  res.json({ ...updated, status: normalizeBookingStatus(updated) })
}

export async function listBookingsByPropertyHandler(req: Request, res: Response) {
  const propertyId = String(req.params?.propertyId || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  const list = await listBookingsByProperty(propertyId)
  const items = list.map((b) => ({ ...b, status: normalizeBookingStatus(b) }))
  res.json({ items })
}
