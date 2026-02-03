import crypto from 'crypto'

export type PropertyType = 'apartment' | 'house' | 'cabin' | 'hotel' | 'other'

export type Property = {
  id: string
  hostId: string
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
  createdAt: Date
  updatedAt: Date
}

const propertiesById = new Map<string, Property>()

function now() {
  return new Date()
}

export function memoryListProperties() {
  return Array.from(propertiesById.values())
}

export function memoryGetPropertyById(id: string) {
  return propertiesById.get(id) || null
}

export function memoryListPropertiesByHost(hostId: string) {
  return Array.from(propertiesById.values()).filter((p) => p.hostId === hostId)
}

export function memoryCreateProperty(params: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) {
  const t = now()
  const id = crypto.randomUUID()
  const property: Property = { id, ...params, createdAt: t, updatedAt: t }
  propertiesById.set(id, property)
  return property
}

export function memoryUpdateProperty(
  id: string,
  patch: Partial<Omit<Property, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>>
) {
  const current = propertiesById.get(id)
  if (!current) return null

  const updated: Property = {
    ...current,
    ...patch,
    id: current.id,
    hostId: current.hostId,
    createdAt: current.createdAt,
    updatedAt: now(),
  }

  propertiesById.set(id, updated)
  return updated
}

export function memoryDeleteProperty(id: string) {
  return propertiesById.delete(id)
}

/** Solo para uso en seed de desarrollo. Vacía todas las propiedades. */
export function memoryResetForDev() {
  propertiesById.clear()
}

