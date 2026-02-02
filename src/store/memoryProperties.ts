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

function seedIfEmpty() {
  if (propertiesById.size > 0) return

  const base: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      hostId: 'seed-host-1',
      title: 'Departamento céntrico con vista',
      description: 'Ideal para parejas o viajes de trabajo. Cerca de todo.',
      location: 'Buenos Aires, AR',
      pricePerNight: 85,
      images: ['https://picsum.photos/seed/airbnb-1/1200/800'],
      amenities: ['wifi', 'kitchen', 'air-conditioning'],
      propertyType: 'apartment',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
    },
    {
      hostId: 'seed-host-2',
      title: 'Casa familiar con patio',
      description: 'Espaciosa y cómoda. Perfecta para familias.',
      location: 'Córdoba, AR',
      pricePerNight: 120,
      images: ['https://picsum.photos/seed/airbnb-2/1200/800'],
      amenities: ['wifi', 'parking', 'washing-machine'],
      propertyType: 'house',
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
    },
  ]

  for (const p of base) {
    const t = now()
    const id = crypto.randomUUID()
    propertiesById.set(id, { id, ...p, createdAt: t, updatedAt: t })
  }
}

seedIfEmpty()

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

