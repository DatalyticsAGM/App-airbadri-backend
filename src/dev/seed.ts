/**
 * Seed de datos de desarrollo. Funciona en modo memoria (resetea y crea) o MongoDB (solo crea).
 * En MongoDB, ejecutar sobre base vacía o asumir posibles duplicados por email.
 */

import { createUser, getUserId } from '../services/auth.service'
import {
  propertyRepository,
  bookingRepository,
  favoriteRepository,
  reviewRepository,
  resetAllMemoryForDev,
  isUsingMemory,
} from '../repositories'
import type { PropertyType } from '../store/memoryProperties'

const SEED_PASSWORD = '123456'

export type SeedResult = {
  ok: boolean
  users: { email: string; id: string; role: string }[]
  propertiesCount: number
  bookingsCount: number
}

export async function runSeed(): Promise<SeedResult> {
  if (isUsingMemory()) {
    resetAllMemoryForDev()
  }

  const users: { email: string; id: string; role: string }[] = []

  const admin = await createUser({
    fullName: 'Admin Sistema',
    email: 'administrador@example.com',
    password: SEED_PASSWORD,
    role: 'admin',
  })
  const adminId = getUserId(admin)
  users.push({ email: 'administrador@example.com', id: adminId, role: 'admin' })

  const host1 = await createUser({
    fullName: 'Ana Host',
    email: 'host1@example.com',
    password: SEED_PASSWORD,
    role: 'host',
  })
  const host1Id = getUserId(host1)
  users.push({ email: 'host1@example.com', id: host1Id, role: 'host' })

  const host2 = await createUser({
    fullName: 'Bruno Host',
    email: 'host2@example.com',
    password: SEED_PASSWORD,
    role: 'host',
  })
  const host2Id = getUserId(host2)
  users.push({ email: 'host2@example.com', id: host2Id, role: 'host' })

  const guest = await createUser({
    fullName: 'Clara Usuario',
    email: 'user@example.com',
    password: SEED_PASSWORD,
    role: 'user',
  })
  const guestId = getUserId(guest)
  users.push({ email: 'user@example.com', id: guestId, role: 'user' })

  const p1 = await propertyRepository.create({
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

  const p2 = await propertyRepository.create({
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

  await propertyRepository.create({
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

  await bookingRepository.create({
    propertyId: p1.id,
    userId: guestId,
    checkIn: '2025-01-01',
    checkOut: '2025-01-05',
    guests: 2,
    totalPrice: 85 * 4,
    status: 'completed',
  })

  await bookingRepository.create({
    propertyId: p2.id,
    userId: guestId,
    checkIn: '2026-03-10',
    checkOut: '2026-03-15',
    guests: 4,
    totalPrice: 120 * 5,
    status: 'confirmed',
  })

  await favoriteRepository.add(guestId, p1.id)
  await reviewRepository.create({
    propertyId: p1.id,
    userId: guestId,
    rating: 5,
    comment: 'Excelente estadía, todo muy limpio.',
    date: new Date().toISOString(),
    userName: 'Clara Usuario',
  })

  return {
    ok: true,
    users,
    propertiesCount: 3,
    bookingsCount: 2,
  }
}
