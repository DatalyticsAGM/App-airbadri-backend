/**
 * Seed de datos de desarrollo. Solo para uso con USE_MEMORY_ONLY o NODE_ENV=development.
 * Resetea los stores in-memory y crea usuarios, propiedades y reservas de ejemplo.
 */

import { createUser, getUserId } from '../services/auth.service'
import {
  memoryCreateBooking,
  memoryResetForDev as resetBookings,
} from '../store/memoryBookings'
import {
  memoryCreateProperty,
  memoryResetForDev as resetProperties,
} from '../store/memoryProperties'
import { memoryResetForDev as resetUsers } from '../store/memoryUsers'
import {
  memoryCreateReview,
  memoryResetForDev as resetReviews,
} from '../store/memoryReviews'
import {
  memoryAddFavorite,
  memoryResetForDev as resetFavorites,
} from '../store/memoryFavorites'
import { memoryResetForDev as resetNotifications } from '../store/memoryNotifications'
import { memoryResetForDev as resetSearchHistory } from '../store/memorySearchHistory'
import type { PropertyType } from '../store/memoryProperties'

const SEED_PASSWORD = '123456'

export type SeedResult = {
  ok: boolean
  users: { email: string; id: string; role: string }[]
  propertiesCount: number
  bookingsCount: number
}

export async function runSeed(): Promise<SeedResult> {
  // Orden: vaciar primero dependientes, luego independientes
  resetBookings()
  resetReviews()
  resetFavorites()
  resetNotifications()
  resetSearchHistory()
  resetProperties()
  resetUsers()

  const users: { email: string; id: string; role: string }[] = []

  const host1 = await createUser({
    fullName: 'Ana Host',
    email: 'host1@example.com',
    password: SEED_PASSWORD,
  })
  const host1Id = getUserId(host1)
  users.push({ email: 'host1@example.com', id: host1Id, role: 'host' })

  const host2 = await createUser({
    fullName: 'Bruno Host',
    email: 'host2@example.com',
    password: SEED_PASSWORD,
  })
  const host2Id = getUserId(host2)
  users.push({ email: 'host2@example.com', id: host2Id, role: 'host' })

  const guest = await createUser({
    fullName: 'Clara Guest',
    email: 'guest@example.com',
    password: SEED_PASSWORD,
  })
  const guestId = getUserId(guest)
  users.push({ email: 'guest@example.com', id: guestId, role: 'guest' })

  const p1 = memoryCreateProperty({
    hostId: host1Id,
    title: 'Departamento céntrico con vista',
    description: 'Ideal para parejas o viajes de trabajo. Cerca de todo.',
    location: 'Buenos Aires, AR',
    pricePerNight: 85,
    images: ['https://picsum.photos/seed/airbnb-1/1200/800'],
    amenities: ['wifi', 'kitchen', 'air-conditioning'],
    propertyType: 'apartment' as PropertyType,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
  })

  const p2 = memoryCreateProperty({
    hostId: host2Id,
    title: 'Casa familiar con patio',
    description: 'Espaciosa y cómoda. Perfecta para familias.',
    location: 'Córdoba, AR',
    pricePerNight: 120,
    images: ['https://picsum.photos/seed/airbnb-2/1200/800'],
    amenities: ['wifi', 'parking', 'washing-machine'],
    propertyType: 'house' as PropertyType,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
  })

  memoryCreateProperty({
    hostId: host1Id,
    title: 'Loft moderno',
    description: 'Diseño minimalista en zona tranquila.',
    location: 'Mendoza, AR',
    pricePerNight: 95,
    images: [],
    amenities: ['wifi', 'air-conditioning'],
    propertyType: 'apartment' as PropertyType,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
  })

  // Reserva pasada (completada) para permitir review
  memoryCreateBooking({
    propertyId: p1.id,
    userId: guestId,
    checkIn: '2025-01-01',
    checkOut: '2025-01-05',
    guests: 2,
    totalPrice: 85 * 4,
    status: 'completed',
  })

  // Reserva futura
  memoryCreateBooking({
    propertyId: p2.id,
    userId: guestId,
    checkIn: '2026-03-10',
    checkOut: '2026-03-15',
    guests: 4,
    totalPrice: 120 * 5,
    status: 'confirmed',
  })

  memoryAddFavorite(guestId, p1.id)
  memoryCreateReview({
    propertyId: p1.id,
    userId: guestId,
    rating: 5,
    comment: 'Excelente estadía, todo muy limpio.',
    date: new Date().toISOString(),
    userName: 'Clara Guest',
  })

  const propertiesCount = 3
  const bookingsCount = 2

  return {
    ok: true,
    users,
    propertiesCount,
    bookingsCount,
  }
}
