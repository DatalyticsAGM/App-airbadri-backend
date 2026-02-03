import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { isPropertyAvailable } from '../services/bookings.service'
import { getBookingPreview } from '../services/bookings.service'
import {
  createProperty,
  deleteProperty,
  getPropertyByIdOrThrow,
  listMyProperties,
  listProperties,
  updateProperty,
  type PropertyFilters,
} from '../services/properties.service'

function toInt(input: unknown) {
  const n = typeof input === 'string' && input.trim() !== '' ? Number(input) : Number(input)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function toNum(input: unknown) {
  const n = typeof input === 'string' && input.trim() !== '' ? Number(input) : Number(input)
  return Number.isFinite(n) ? n : null
}

function parseAmenities(input: unknown) {
  if (Array.isArray(input)) return input.map(String)
  const s = String(input || '').trim()
  if (!s) return []
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

export async function listPropertiesHandler(req: Request, res: Response) {
  const filters: PropertyFilters = {}

  const q = String(req.query?.q || '').trim()
  if (q) filters.q = q

  const location = String(req.query?.location || '').trim()
  if (location) filters.location = location

  const minPrice = toNum(req.query?.minPrice)
  if (minPrice !== null) filters.minPrice = minPrice

  const maxPrice = toNum(req.query?.maxPrice)
  if (maxPrice !== null) filters.maxPrice = maxPrice

  const amenities = parseAmenities(req.query?.amenities)
  if (amenities.length) filters.amenities = amenities

  const hostId = String(req.query?.hostId || '').trim()
  if (hostId) filters.hostId = hostId

  const checkIn = String(req.query?.checkIn || '').trim()
  const checkOut = String(req.query?.checkOut || '').trim()
  if (checkIn || checkOut) {
    filters.checkIn = checkIn
    filters.checkOut = checkOut
  }

  const minRating = toNum(req.query?.minRating)
  if (minRating !== null) filters.minRating = minRating

  const page = toInt(req.query?.page)
  if (page !== null) filters.page = page

  const limit = toInt(req.query?.limit)
  if (limit !== null) filters.limit = limit

  const sort = String(req.query?.sort || '').trim()
  if (sort) filters.sort = sort as any

  const result = await listProperties(filters)
  res.json(result)
}

export async function getPropertyHandler(req: Request, res: Response) {
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  const property = await getPropertyByIdOrThrow(id)
  res.json(property)
}

export async function getAvailabilityHandler(req: Request, res: Response) {
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  await getPropertyByIdOrThrow(id)

  const checkIn = String(req.query?.checkIn || '').trim()
  const checkOut = String(req.query?.checkOut || '').trim()
  if (!checkIn || !checkOut) {
    throw httpError(400, 'VALIDATION_ERROR', 'checkIn and checkOut are required')
  }

  const available = await isPropertyAvailable(id, checkIn, checkOut)
  res.json({ available })
}

export async function getBookingPreviewHandler(req: Request, res: Response) {
  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  const checkIn = String(req.query?.checkIn || '').trim()
  const checkOut = String(req.query?.checkOut || '').trim()
  const guests = Number(req.query?.guests) || 1
  if (!checkIn || !checkOut) {
    throw httpError(400, 'VALIDATION_ERROR', 'checkIn and checkOut are required')
  }

  const preview = await getBookingPreview(id, checkIn, checkOut, guests)
  res.json(preview)
}

export async function listMineHandler(req: Request, res: Response) {
  const hostId = String((req as any).userId || '')
  if (!hostId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const items = await listMyProperties(hostId)
  res.json({ items })
}

export async function createPropertyHandler(req: Request, res: Response) {
  const hostId = String((req as any).userId || '')
  if (!hostId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const title = String(req.body?.title || '')
  const description = String(req.body?.description || '')
  const location = String(req.body?.location || '')
  const pricePerNight = Number(req.body?.pricePerNight)
  const images = Array.isArray(req.body?.images) ? req.body.images : []
  const amenities = Array.isArray(req.body?.amenities) ? req.body.amenities : []

  const property = await createProperty(hostId, {
    title,
    description,
    location,
    pricePerNight,
    images,
    amenities,
    propertyType: req.body?.propertyType,
    bedrooms: req.body?.bedrooms,
    bathrooms: req.body?.bathrooms,
    maxGuests: req.body?.maxGuests,
  })

  res.status(201).json(property)
}

export async function updatePropertyHandler(req: Request, res: Response) {
  const hostId = String((req as any).userId || '')
  if (!hostId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  const updated = await updateProperty(hostId, id, req.body || {})

  res.json(updated)
}

export async function deletePropertyHandler(req: Request, res: Response) {
  const hostId = String((req as any).userId || '')
  if (!hostId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const id = String(req.params?.id || '').trim()
  if (!id) throw httpError(400, 'VALIDATION_ERROR', 'id is required')

  await deleteProperty(hostId, id)
  res.status(204).send()
}

