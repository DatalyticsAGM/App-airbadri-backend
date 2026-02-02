import { httpError } from '../middlewares/errorHandler'
import {
  memoryCreateProperty,
  memoryDeleteProperty,
  memoryGetPropertyById,
  memoryListProperties,
  memoryListPropertiesByHost,
  memoryUpdateProperty,
  type Property,
  type PropertyType,
} from '../store/memoryProperties'
import { memoryDeleteBookingsByProperty } from '../store/memoryBookings'
import { isPropertyAvailable } from './bookings.service'
import { memoryCalculateAverageRating } from '../store/memoryReviews'

export type ListPropertiesResult = {
  items: Property[]
  page: number
  limit: number
  total: number
}

export type PropertyFilters = {
  q?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  amenities?: string[]
  propertyType?: PropertyType
  minRating?: number
  checkIn?: string
  checkOut?: string
  minBedrooms?: number
  minBathrooms?: number
  minGuests?: number
  hostId?: string
  page?: number
  limit?: number
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function listProperties(filters: PropertyFilters): ListPropertiesResult {
  const page = clampInt(filters.page ?? 1, 1, 10_000)
  const limit = clampInt(filters.limit ?? 20, 1, 100)

  const q = (filters.q || '').trim().toLowerCase()
  const location = (filters.location || '').trim().toLowerCase()
  const amenities = (filters.amenities || []).map((a) => a.trim().toLowerCase()).filter(Boolean)

  let items = memoryListProperties()

  if (filters.hostId) {
    items = items.filter((p) => p.hostId === filters.hostId)
  }

  if (q) {
    items = items.filter((p) => {
      const hay = `${p.title} ${p.description} ${p.location}`.toLowerCase()
      return hay.includes(q)
    })
  }

  if (location) {
    items = items.filter((p) => p.location.toLowerCase().includes(location))
  }

  if (typeof filters.minPrice === 'number') {
    items = items.filter((p) => p.pricePerNight >= filters.minPrice!)
  }

  if (typeof filters.maxPrice === 'number') {
    items = items.filter((p) => p.pricePerNight <= filters.maxPrice!)
  }

  if (amenities.length > 0) {
    items = items.filter((p) => {
      const set = new Set(p.amenities.map((a) => a.toLowerCase()))
      return amenities.every((a) => set.has(a))
    })
  }

  if (filters.propertyType) {
    items = items.filter((p) => p.propertyType === filters.propertyType)
  }

  if (typeof filters.minBedrooms === 'number') {
    items = items.filter((p) => (p.bedrooms || 0) >= filters.minBedrooms!)
  }

  if (typeof filters.minBathrooms === 'number') {
    items = items.filter((p) => (p.bathrooms || 0) >= filters.minBathrooms!)
  }

  if (typeof filters.minGuests === 'number') {
    items = items.filter((p) => (p.maxGuests || 0) >= filters.minGuests!)
  }

  if (typeof filters.minRating === 'number') {
    const minRating = Number(filters.minRating)
    if (!Number.isFinite(minRating)) throw httpError(400, 'VALIDATION_ERROR', 'minRating is invalid')
    items = items.filter((p) => memoryCalculateAverageRating(p.id) >= minRating)
  }

  if (filters.checkIn || filters.checkOut) {
    const checkIn = String(filters.checkIn || '').trim()
    const checkOut = String(filters.checkOut || '').trim()
    if (!checkIn || !checkOut) {
      throw httpError(400, 'VALIDATION_ERROR', 'checkIn and checkOut are required together')
    }
    items = items.filter((p) => isPropertyAvailable(p.id, checkIn, checkOut))
  }

  const total = items.length
  const start = (page - 1) * limit
  const paged = items.slice(start, start + limit)

  return { items: paged, page, limit, total }
}

export function listMyProperties(hostId: string) {
  return memoryListPropertiesByHost(hostId)
}

export function getPropertyByIdOrThrow(id: string) {
  const property = memoryGetPropertyById(id)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return property
}

export function createProperty(hostId: string, input: {
  title: string
  description: string
  location: string
  pricePerNight: number
  images: string[]
  amenities: string[]
  propertyType?: PropertyType
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
}) {
  const title = input.title.trim()
  const description = input.description.trim()
  const location = input.location.trim()

  if (!title) throw httpError(400, 'VALIDATION_ERROR', 'title is required')
  if (!location) throw httpError(400, 'VALIDATION_ERROR', 'location is required')
  if (!Number.isFinite(input.pricePerNight) || input.pricePerNight <= 0) {
    throw httpError(400, 'VALIDATION_ERROR', 'pricePerNight must be a positive number')
  }

  const images = Array.isArray(input.images) ? input.images.map(String).map((s) => s.trim()).filter(Boolean) : []
  const amenities = Array.isArray(input.amenities)
    ? input.amenities.map(String).map((s) => s.trim()).filter(Boolean)
    : []

  return memoryCreateProperty({
    hostId,
    title,
    description,
    location,
    pricePerNight: input.pricePerNight,
    images,
    amenities,
    propertyType: input.propertyType,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    maxGuests: input.maxGuests,
  })
}

export function updateProperty(hostId: string, propertyId: string, patch: Partial<{
  title: string
  description: string
  location: string
  pricePerNight: number
  images: string[]
  amenities: string[]
  propertyType?: PropertyType
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
}>) {
  const current = getPropertyByIdOrThrow(propertyId)
  if (current.hostId !== hostId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  const next: Record<string, unknown> = { ...patch }

  if (typeof patch.title === 'string') {
    const v = patch.title.trim()
    if (!v) throw httpError(400, 'VALIDATION_ERROR', 'title is invalid')
    next.title = v
  }

  if (typeof patch.description === 'string') {
    next.description = patch.description.trim()
  }

  if (typeof patch.location === 'string') {
    const v = patch.location.trim()
    if (!v) throw httpError(400, 'VALIDATION_ERROR', 'location is invalid')
    next.location = v
  }

  if (patch.pricePerNight !== undefined) {
    const n = Number(patch.pricePerNight)
    if (!Number.isFinite(n) || n <= 0) {
      throw httpError(400, 'VALIDATION_ERROR', 'pricePerNight must be a positive number')
    }
    next.pricePerNight = n
  }

  if (patch.images !== undefined) {
    if (!Array.isArray(patch.images)) throw httpError(400, 'VALIDATION_ERROR', 'images must be an array')
    next.images = patch.images.map(String).map((s) => s.trim()).filter(Boolean)
  }

  if (patch.amenities !== undefined) {
    if (!Array.isArray(patch.amenities)) throw httpError(400, 'VALIDATION_ERROR', 'amenities must be an array')
    next.amenities = patch.amenities.map(String).map((s) => s.trim()).filter(Boolean)
  }

  const updated = memoryUpdateProperty(propertyId, next as any)
  if (!updated) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return updated
}

export function deleteProperty(hostId: string, propertyId: string) {
  const current = getPropertyByIdOrThrow(propertyId)
  if (current.hostId !== hostId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  // Limpieza simple: si se borra la propiedad, se borran reservas asociadas en memoria.
  memoryDeleteBookingsByProperty(propertyId)

  const ok = memoryDeleteProperty(propertyId)
  return ok
}

