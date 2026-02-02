import crypto from 'crypto'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type Booking = {
  id: string
  propertyId: string
  userId: string
  checkIn: string // ISO date (YYYY-MM-DD recomendado)
  checkOut: string // ISO date (YYYY-MM-DD recomendado)
  guests: number
  totalPrice: number
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
}

const bookingsById = new Map<string, Booking>()

function now() {
  return new Date()
}

export function memoryCreateBooking(params: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) {
  const t = now()
  const id = crypto.randomUUID()
  const booking: Booking = { id, ...params, createdAt: t, updatedAt: t }
  bookingsById.set(id, booking)
  return booking
}

export function memoryGetBookingById(id: string) {
  return bookingsById.get(id) || null
}

export function memoryListBookings() {
  return Array.from(bookingsById.values())
}

export function memoryListBookingsByUser(userId: string) {
  return Array.from(bookingsById.values()).filter((b) => b.userId === userId)
}

export function memoryListBookingsByProperty(propertyId: string) {
  return Array.from(bookingsById.values()).filter((b) => b.propertyId === propertyId)
}

export function memoryUpdateBookingStatus(id: string, status: BookingStatus) {
  const current = bookingsById.get(id)
  if (!current) return null

  const updated: Booking = { ...current, status, updatedAt: now() }
  bookingsById.set(id, updated)
  return updated
}

export function memoryDeleteBookingsByProperty(propertyId: string) {
  let removed = 0
  for (const b of bookingsById.values()) {
    if (b.propertyId !== propertyId) continue
    bookingsById.delete(b.id)
    removed++
  }
  return removed
}

