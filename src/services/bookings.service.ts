/**
 * Módulo bookings.service (servicio de reservas).
 *
 * Lógica de negocio de reservas: disponibilidad, vista previa de precio, listado,
 * creación y cancelación. Usa repositorios (memoria o MongoDB) y notifica al host vía notifications.service.
 */
import { httpError } from '../middlewares/errorHandler'
import { propertyRepository, bookingRepository } from '../repositories'
import type { Booking, BookingStatus } from '../store/memoryBookings'
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

/**
 * Comprueba si la propiedad está disponible para las fechas indicadas (sin solapamiento con reservas confirmadas).
 */
export async function isPropertyAvailable(propertyId: string, checkIn: string, checkOut: string): Promise<boolean> {
  const inDate = parseDate(checkIn)
  const outDate = parseDate(checkOut)
  if (!inDate || !outDate) throw httpError(400, 'VALIDATION_ERROR', 'Invalid dates')
  if (inDate >= outDate) throw httpError(400, 'VALIDATION_ERROR', 'checkIn must be before checkOut')

  const bookings = await bookingRepository.listByProperty(propertyId)
  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const bIn = parseDate(b.checkIn)
    const bOut = parseDate(b.checkOut)
    if (!bIn || !bOut) continue
    if (overlap(inDate, outDate, bIn, bOut)) return false
  }
  return true
}

export type BookingPreview = {
  available: boolean
  pricePerNight: number
  nights: number
  totalPrice: number
}

/**
 * Calcula la vista previa de una reserva: disponibilidad, noches y precio total.
 */
export async function getBookingPreview(propertyId: string, checkIn: string, checkOut: string, guests: number) {
  const property = await propertyRepository.getById(propertyId)
  if (!property) throw httpError(404, 'PROPERTY_NOT_FOUND', 'Property not found')

  const inDate = parseDate(checkIn)
  const outDate = parseDate(checkOut)
  if (!inDate || !outDate) throw httpError(400, 'VALIDATION_ERROR', 'Invalid dates')
  if (inDate >= outDate) throw httpError(400, 'VALIDATION_ERROR', 'checkIn must be before checkOut')

  const g = Math.trunc(Number(guests))
  if (!Number.isFinite(g) || g <= 0) throw httpError(400, 'VALIDATION_ERROR', 'guests is invalid')
  if (property.maxGuests && g > property.maxGuests) {
    throw httpError(400, 'GUESTS_EXCEED_MAX', 'Number of guests exceeds property capacity')
  }

  const available = await isPropertyAvailable(propertyId, checkIn, checkOut)
  const nights = Math.round((outDate.getTime() - inDate.getTime()) / MS_PER_DAY)
  const totalPrice = nights > 0 ? nights * property.pricePerNight : 0

  return {
    available,
    pricePerNight: property.pricePerNight,
    nights: nights > 0 ? nights : 0,
    totalPrice,
  }
}

/**
 * Lista todas las reservas del usuario.
 */
export async function listMyBookings(userId: string) {
  return bookingRepository.listByUser(userId)
}

/**
 * Lista las reservas de una propiedad (para dashboard host).
 */
export async function listBookingsByProperty(propertyId: string) {
  return bookingRepository.listByProperty(propertyId)
}

/**
 * Obtiene una reserva por id si pertenece al usuario; si no, lanza error.
 */
export async function getMyBookingByIdOrThrow(
  userId: string,
  bookingId: string,
  opts?: { isAdmin?: boolean }
) {
  const booking = await bookingRepository.getById(bookingId)
  if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  const isAdmin = Boolean(opts?.isAdmin)
  // Admin puede acceder a cualquier reserva.
  if (!isAdmin && booking.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')
  return booking
}

/**
 * Crea una reserva: valida propiedad, fechas, huéspedes y disponibilidad; persiste y notifica al host.
 */
export async function createBooking(userId: string, input: {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
}) {
  const propertyId = String(input.propertyId || '').trim()
  if (!propertyId) throw httpError(400, 'VALIDATION_ERROR', 'propertyId is required')

  const property = await propertyRepository.getById(propertyId)
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
    throw httpError(400, 'GUESTS_EXCEED_MAX', 'Number of guests exceeds property capacity')
  }

  const available = await isPropertyAvailable(propertyId, checkIn, checkOut)
  // En Postman se permite 201/400/404 (no 409). Tratamos la no-disponibilidad como 400 de negocio.
  if (!available) throw httpError(400, 'NOT_AVAILABLE', 'Property is not available for selected dates')

  const nights = Math.round((outDate.getTime() - inDate.getTime()) / MS_PER_DAY)
  if (!Number.isFinite(nights) || nights <= 0) throw httpError(400, 'VALIDATION_ERROR', 'Invalid nights')

  const totalPrice = nights * property.pricePerNight

  const booking = await bookingRepository.create({
    propertyId,
    userId,
    checkIn,
    checkOut,
    guests,
    totalPrice,
    status: 'confirmed',
  })

  if (property.hostId && property.hostId !== userId) {
    await createNotification({
      userId: property.hostId,
      type: 'booking_confirmed',
      title: 'Nueva reserva confirmada',
      message: `Nueva reserva para "${property.title}" (${checkIn} → ${checkOut}).`,
      link: `/host/dashboard`,
    })
  }

  return booking
}

/**
 * Cancela una reserva del usuario. Notifica al host.
 */
export async function cancelMyBooking(userId: string, bookingId: string, opts?: { isAdmin?: boolean }) {
  const booking = await getMyBookingByIdOrThrow(userId, bookingId, opts)
  if (booking.status === 'cancelled') return booking

  const updated = await bookingRepository.updateStatus(bookingId, 'cancelled')
  if (!updated) throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found')

  const property = await propertyRepository.getById(updated.propertyId)
  if (property && property.hostId && property.hostId !== userId) {
    await createNotification({
      userId: property.hostId,
      type: 'booking_cancelled',
      title: 'Reserva cancelada',
      message: `Una reserva para "${property.title}" fue cancelada.`,
      link: `/host/dashboard`,
    })
  }

  return updated
}

/**
 * Indica si la reserva se considera completada (checkOut ya pasó y no está cancelada).
 */
export function isBookingCompleted(booking: Booking) {
  if (booking.status === 'cancelled') return false
  const out = parseDate(booking.checkOut)
  if (!out) return false
  return Date.now() > out.getTime()
}

/**
 * Normaliza el estado de la reserva para la API: si ya pasó el checkOut se considera 'completed'.
 */
export function normalizeBookingStatus(booking: Booking): BookingStatus {
  if (booking.status === 'cancelled') return 'cancelled'
  return isBookingCompleted(booking) ? 'completed' : booking.status
}
