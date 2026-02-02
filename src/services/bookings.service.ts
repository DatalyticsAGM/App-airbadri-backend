import { httpError } from '../middlewares/errorHandler'
import { memoryGetPropertyById } from '../store/memoryProperties'
import {
  memoryCreateBooking,
  memoryGetBookingById,
  memoryListBookingsByProperty,
  memoryListBookingsByUser,
  memoryUpdateBookingStatus,
  type Booking,
  type BookingStatus,
} from '../store/memoryBookings'
import { createNotification } from './notifications.service'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDate(dateStr: string) {
  const d = new Date(dateStr)
  if (!Number.isFinite(d.getTime())) return null
  return d
}

function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd
}

export function isPropertyAvailable(propertyId: string, checkIn: string, checkOut: string) {
  const inDate = parseDate(checkIn)
  const outDate = parseDate(checkOut)
  if (!inDate || !outDate) throw httpError(400, 'VALIDATION_ERROR', 'Invalid dates')
  if (inDate >= outDate) throw httpError(400, 'VALIDATION_ERROR', 'checkIn must be before checkOut')

  const bookings = memoryListBookingsByProperty(propertyId)
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const bIn = parseDate(b.checkIn)
    const bOut = parseDate(b.checkOut)
    if (!bIn || !bOut) continue
    if (overlap(inDate, outDate, bIn, bOut)) return false
  }

  return true
}

export function listMyBookings(userId: string) {
  return memoryListBookingsByUser(userId)
}

export function getMyBookingByIdOrThrow(userId: string, bookingId: string) {
  const booking = memoryGetBookingById(bookingId)
  if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  if (booking.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')
  return booking
}

export function createBooking(userId: string, input: {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
}) {
  const propertyId = String(input.propertyId || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  const property = memoryGetPropertyById(propertyId)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')

  const checkIn = String(input.checkIn || '').trim()
  const checkOut = String(input.checkOut || '').trim()
  const inDate = parseDate(checkIn)
  const outDate = parseDate(checkOut)
  if (!inDate || !outDate) throw httpError(400, 'VALIDATION_ERROR', 'Invalid dates')
  if (inDate >= outDate) throw httpError(400, 'VALIDATION_ERROR', 'checkIn must be before checkOut')

  const guests = Math.trunc(Number(input.guests))
  if (!Number.isFinite(guests) || guests <= 0) throw httpError(400, 'VALIDATION_ERROR', 'guests is invalid')
  if (property.maxGuests && guests > property.maxGuests) {
    throw httpError(400, 'VALIDATION_ERROR', 'guests exceeds maxGuests')
  }

  const available = isPropertyAvailable(propertyId, checkIn, checkOut)
  if (!available) throw httpError(409, 'NOT_AVAILABLE', 'Property is not available for selected dates')

  const nights = Math.round((outDate.getTime() - inDate.getTime()) / MS_PER_DAY)
  if (!Number.isFinite(nights) || nights <= 0) throw httpError(400, 'VALIDATION_ERROR', 'Invalid nights')

  const totalPrice = nights * property.pricePerNight

  const booking = memoryCreateBooking({
    propertyId,
    userId,
    checkIn,
    checkOut,
    guests,
    totalPrice,
    status: 'confirmed',
  })

  // Notificación MOCK para el host
  if (property.hostId && property.hostId !== userId) {
    createNotification({
      userId: property.hostId,
      type: 'booking_confirmed',
      title: 'Nueva reserva confirmada',
      message: `Nueva reserva para "${property.title}" (${checkIn} → ${checkOut}).`,
      link: `/host/dashboard`,
    })
  }

  return booking
}

export function cancelMyBooking(userId: string, bookingId: string) {
  const booking = getMyBookingByIdOrThrow(userId, bookingId)
  if (booking.status === 'cancelled') return booking

  const updated = memoryUpdateBookingStatus(bookingId, 'cancelled')
  if (!updated) throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found')

  const property = memoryGetPropertyById(updated.propertyId)
  if (property && property.hostId && property.hostId !== userId) {
    createNotification({
      userId: property.hostId,
      type: 'booking_cancelled',
      title: 'Reserva cancelada',
      message: `Una reserva para "${property.title}" fue cancelada.`,
      link: `/host/dashboard`,
    })
  }

  return updated
}

export function isBookingCompleted(booking: Booking) {
  if (booking.status === 'cancelled') return false
  const out = parseDate(booking.checkOut)
  if (!out) return false
  return Date.now() > out.getTime()
}

export function normalizeBookingStatus(booking: Booking): BookingStatus {
  // Para el milestone, consideramos "completed" cuando ya pasó el checkOut.
  if (booking.status === 'cancelled') return 'cancelled'
  return isBookingCompleted(booking) ? 'completed' : booking.status
}

