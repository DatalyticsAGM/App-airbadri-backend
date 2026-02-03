/**
 * Módulo properties.service (servicio de propiedades).
 *
 * Lógica de negocio de propiedades: listado con filtros y paginación, CRUD por host,
 * disponibilidad (usa bookings.service). Usa stores en memoria (memoryProperties, memoryBookings, memoryReviews).
 * Dependencias: middlewares/errorHandler, store/memoryProperties, store/memoryBookings,
 * store/memoryReviews, bookings.service.
 */
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

/**
 * Resultado paginado del listado de propiedades.
 *
 * @property items - Lista de propiedades de la página actual.
 * @property page - Número de página (1-based).
 * @property limit - Tamaño de página.
 * @property total - Total de elementos que cumplen el filtro (sin paginar).
 */
export type ListPropertiesResult = {
  items: Property[]
  page: number
  limit: number
  total: number
}

/**
 * Criterios de ordenación del listado de propiedades.
 * - price_asc / price_desc: por precio por noche.
 * - rating_desc: por valoración media descendente.
 * - newest: más recientes primero.
 * - relevance: orden por defecto (tras aplicar búsqueda/filtros).
 */
export type PropertySort = 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'relevance'

/**
 * Filtros y opciones de listado de propiedades. Todos opcionales.
 *
 * @property q - Búsqueda por texto (título, descripción, ubicación).
 * @property location - Filtro por ubicación.
 * @property minPrice / maxPrice - Rango de precio por noche.
 * @property amenities - Lista de comodidades requeridas (todas deben estar).
 * @property propertyType - Tipo de propiedad.
 * @property minRating - Valoración media mínima.
 * @property checkIn / checkOut - Solo propiedades disponibles en ese rango (ambos requeridos juntos).
 * @property minBedrooms / minBathrooms / minGuests - Mínimos numéricos.
 * @property hostId - Solo propiedades de ese host.
 * @property sort - Ordenación (PropertySort).
 * @property page / limit - Paginación (page 1-based, limit por página).
 */
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
 * Lista propiedades aplicando filtros, ordenación y paginación. La disponibilidad (checkIn/checkOut) usa bookings.service.
 *
 * @param filters - Objeto con filtros opcionales (q, location, precios, amenities, tipo, rating, fechas, hostId, sort, page, limit).
 * @returns ListPropertiesResult con items, page, limit y total.
 * @throws httpError 400 si minRating no es válido o si solo se pasa checkIn o checkOut (deben ir juntos).
 *
 * @example
 * const result = listProperties({ q: 'playa', minPrice: 50, maxPrice: 150, page: 1, limit: 10 })
 */
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

  const sort = (filters.sort || 'relevance') as PropertySort
  const validSorts: PropertySort[] = ['price_asc', 'price_desc', 'rating_desc', 'newest', 'relevance']
  const sortKey = validSorts.includes(sort) ? sort : 'relevance'

  if (sortKey === 'price_asc') items = [...items].sort((a, b) => a.pricePerNight - b.pricePerNight)
  else if (sortKey === 'price_desc') items = [...items].sort((a, b) => b.pricePerNight - a.pricePerNight)
  else if (sortKey === 'rating_desc') {
    items = [...items].sort((a, b) => memoryCalculateAverageRating(b.id) - memoryCalculateAverageRating(a.id))
  } else if (sortKey === 'newest') {
    items = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  // 'relevance': mantener orden actual (ya filtrado por q/location)

  const total = items.length
  const start = (page - 1) * limit
  const paged = items.slice(start, start + limit)

  return { items: paged, page, limit, total }
}

/**
 * Lista las propiedades creadas por un host.
 *
 * @param hostId - Id del host (usuario).
 * @returns Lista de propiedades del store en memoria.
 */
export function listMyProperties(hostId: string) {
  return memoryListPropertiesByHost(hostId)
}

/**
 * Obtiene una propiedad por id; si no existe lanza error 404.
 *
 * @param id - Id de la propiedad.
 * @returns La propiedad.
 * @throws httpError 404 si no existe.
 */
export function getPropertyByIdOrThrow(id: string) {
  const property = memoryGetPropertyById(id)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return property
}

/**
 * Crea una nueva propiedad asociada al host. Valida título, ubicación y precio.
 *
 * @param hostId - Id del host que crea la propiedad.
 * @param input - title, description, location, pricePerNight, images, amenities y opcionales (propertyType, bedrooms, bathrooms, maxGuests).
 * @returns La propiedad creada.
 * @throws httpError 400 si title o location están vacíos o pricePerNight no es un número positivo.
 */
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

/**
 * Actualiza una propiedad. Solo el host dueño puede actualizarla. Aplica validaciones a los campos enviados.
 *
 * @param hostId - Id del host (debe coincidir con property.hostId).
 * @param propertyId - Id de la propiedad.
 * @param patch - Campos a actualizar (parcial: title, description, location, pricePerNight, images, amenities, etc.).
 * @returns La propiedad actualizada.
 * @throws httpError 403 si no es el host; 404 si no existe la propiedad; 400 por validación de campos.
 */
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

  type PropertyPatch = Partial<Omit<Property, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>
  const next: PropertyPatch = {}

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

  const updated = memoryUpdateProperty(propertyId, next)
  if (!updated) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')
  return updated
}

/**
 * Elimina una propiedad. Solo el host dueño puede eliminarla. Borra también las reservas asociadas en memoria.
 *
 * @param hostId - Id del host (debe coincidir con property.hostId).
 * @param propertyId - Id de la propiedad.
 * @returns true si se eliminó correctamente.
 * @throws httpError 403 si no es el host; 404 si no existe la propiedad.
 */
export function deleteProperty(hostId: string, propertyId: string) {
  const current = getPropertyByIdOrThrow(propertyId)
  if (current.hostId !== hostId) throw httpError(403, 'FORBIDDEN', 'Not allowed')

  // Limpieza simple: si se borra la propiedad, se borran reservas asociadas en memoria.
  memoryDeleteBookingsByProperty(propertyId)

  const ok = memoryDeleteProperty(propertyId)
  return ok
}

