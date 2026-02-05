/**
 * Módulo properties.service (servicio de propiedades).
 *
 * Lógica de negocio de propiedades: listado con filtros y paginación, CRUD por host,
 * disponibilidad (usa bookings.service). Usa repositorios (memoria o MongoDB).
 */
import { httpError } from '../middlewares/errorHandler'
import { propertyRepository, bookingRepository, reviewRepository, userRepository } from '../repositories'
import type { Property, PropertyType } from '../store/memoryProperties'
import { isPropertyAvailable } from './bookings.service'

/**
 * Resultado paginado del listado de propiedades.
 */
export type ListPropertiesResult = {
  items: Property[]
  page: number
  limit: number
  total: number
}

export type PropertySort = 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'relevance'

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
  sort?: PropertySort
  page?: number
  limit?: number
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Lista propiedades aplicando filtros, ordenación y paginación.
 */
export async function listProperties(filters: PropertyFilters): Promise<ListPropertiesResult> {
  const page = clampInt(filters.page ?? 1, 1, 10_000)
  const limit = clampInt(filters.limit ?? 20, 1, 100)

  const q = (filters.q || '').trim().toLowerCase()
  const location = (filters.location || '').trim().toLowerCase()
  const amenities = (filters.amenities || []).map((a) => a.trim().toLowerCase()).filter(Boolean)

  let items = await propertyRepository.list()

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
    const withRating: Property[] = []
    for (const p of items) {
      const avg = await reviewRepository.getAverageRating(p.id)
      if (avg >= minRating) withRating.push(p)
    }
    items = withRating
  }

  if (filters.checkIn || filters.checkOut) {
    const checkIn = String(filters.checkIn || '').trim()
    const checkOut = String(filters.checkOut || '').trim()
    if (!checkIn || !checkOut) {
      throw httpError(400, 'VALIDATION_ERROR', 'checkIn and checkOut are required together')
    }
    const availableItems: Property[] = []
    for (const p of items) {
      const ok = await isPropertyAvailable(p.id, checkIn, checkOut)
      if (ok) availableItems.push(p)
    }
    items = availableItems
  }

  const sort = (filters.sort || 'relevance') as PropertySort
  const validSorts: PropertySort[] = ['price_asc', 'price_desc', 'rating_desc', 'newest', 'relevance']
  const sortKey = validSorts.includes(sort) ? sort : 'relevance'

  if (sortKey === 'price_asc') items = [...items].sort((a, b) => a.pricePerNight - b.pricePerNight)
  else if (sortKey === 'price_desc') items = [...items].sort((a, b) => b.pricePerNight - a.pricePerNight)
  else if (sortKey === 'rating_desc') {
    const withAvg = await Promise.all(items.map(async (p) => ({ p, avg: await reviewRepository.getAverageRating(p.id) })))
    withAvg.sort((a, b) => b.avg - a.avg)
    items = withAvg.map((x) => x.p)
  } else if (sortKey === 'newest') {
    items = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  const total = items.length
  const start = (page - 1) * limit
  const paged = items.slice(start, start + limit)

  return { items: paged, page, limit, total }
}

/**
 * Lista las propiedades creadas por un host.
 */
export async function listMyProperties(hostId: string) {
  return propertyRepository.listByHost(hostId)
}

/**
 * Obtiene una propiedad por id; si no existe lanza error 404.
 */
export async function getPropertyByIdOrThrow(id: string) {
  const property = await propertyRepository.getById(id)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return property
}

/**
 * Crea una nueva propiedad asociada al host.
 */
export async function createProperty(hostId: string, input: {
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

  const property = await propertyRepository.create({
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

  // Quien ofrece una vivienda pasa a ser host (distinto del usuario que solo alquila).
  const user = await userRepository.findById(hostId)
  if (user && user.role === 'user') {
    await userRepository.update(hostId, { role: 'host' })
  }

  return property
}

/**
 * Actualiza una propiedad. Solo el host dueño puede actualizarla.
 */
export async function updateProperty(hostId: string, propertyId: string, patch: Partial<{
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
}>, opts?: { isAdmin?: boolean }) {
  const current = await getPropertyByIdOrThrow(propertyId)
  const isAdmin = Boolean(opts?.isAdmin)
  if (!isAdmin && current.hostId !== hostId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  type PropertyPatch = Partial<Omit<Property, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>
  const next: PropertyPatch = {}

  if (typeof patch?.title === 'string') {
    const v = patch.title.trim()
    if (!v) throw httpError(400, 'VALIDATION_ERROR', 'title is invalid')
    next.title = v
  }

  if (typeof patch?.description === 'string') {
    next.description = patch.description.trim()
  }

  if (typeof patch?.location === 'string') {
    const v = patch.location.trim()
    if (!v) throw httpError(400, 'VALIDATION_ERROR', 'location is invalid')
    next.location = v
  }

  if (patch?.pricePerNight !== undefined) {
    const n = Number(patch.pricePerNight)
    if (!Number.isFinite(n) || n <= 0) {
      throw httpError(400, 'VALIDATION_ERROR', 'pricePerNight must be a positive number')
    }
    next.pricePerNight = n
  }

  if (patch?.images !== undefined) {
    if (!Array.isArray(patch.images)) throw httpError(400, 'VALIDATION_ERROR', 'images must be an array')
    next.images = patch.images.map(String).map((s) => s.trim()).filter(Boolean)
  }

  if (patch?.amenities !== undefined) {
    if (!Array.isArray(patch.amenities)) throw httpError(400, 'VALIDATION_ERROR', 'amenities must be an array')
    next.amenities = patch.amenities.map(String).map((s) => s.trim()).filter(Boolean)
  }

  const updated = await propertyRepository.update(propertyId, next)
  if (!updated) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return updated
}

/**
 * Elimina una propiedad. Solo el host dueño puede eliminarla. Borra también las reservas asociadas.
 */
export async function deleteProperty(hostId: string, propertyId: string, opts?: { isAdmin?: boolean }) {
  const current = await getPropertyByIdOrThrow(propertyId)
  const isAdmin = Boolean(opts?.isAdmin)
  if (!isAdmin && current.hostId !== hostId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  await bookingRepository.deleteByProperty(propertyId)
  const ok = await propertyRepository.delete(propertyId)

  // Si ya no tiene ninguna propiedad, deja de ser host y vuelve a user (no se toca admin).
  if (ok) {
    const remaining = await propertyRepository.listByHost(hostId)
    if (remaining.length === 0) {
      const user = await userRepository.findById(hostId)
      if (user && user.role === 'host') {
        await userRepository.update(hostId, { role: 'user' })
      }
    }
  }

  return ok
}
