/**
 * Módulo bookings.service (servicio de reservas).
 *
 * Lógica de negocio de reservas: disponibilidad, vista previa de precio, listado,
 * creación y cancelación. Usa el store en memoria (memoryBookings, memoryProperties)
 * y notifica al host vía notifications.service. Dependencias: middlewares/errorHandler,
 * store/memoryBookings, store/memoryProperties, notifications.service.
 */
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

/**
 * Comprueba si la propiedad está disponible para las fechas indicadas (sin solapamiento con reservas confirmadas).
 *
 * @param propertyId - Id de la propiedad.
 * @param checkIn - Fecha de entrada (string parseable por Date).
 * @param checkOut - Fecha de salida (string parseable por Date).
 * @returns true si está disponible, false si hay solapamiento con alguna reserva no cancelada.
 * @throws httpError 400 si las fechas son inválidas o checkIn >= checkOut.
 */
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

/**
 * Resultado de la vista previa de una reserva: disponibilidad, precio por noche, noches y total.
 *
 * @property available - Si la propiedad está libre en esas fechas.
 * @property pricePerNight - Precio por noche de la propiedad.
 * @property nights - Número de noches entre checkIn y checkOut.
 * @property totalPrice - Precio total (nights * pricePerNight).
 */
export type BookingPreview = {
  available: boolean
  pricePerNight: number
  nights: number
  totalPrice: number
}

/**
 * Calcula la vista previa de una reserva: disponibilidad, noches y precio total. Valida fechas y número de huéspedes.
 *
 * @param propertyId - Id de la propiedad.
 * @param checkIn - Fecha de entrada.
 * @param checkOut - Fecha de salida.
 * @param guests - Número de huéspedes (debe ser válido y no superar maxGuests de la propiedad).
 * @returns Objeto BookingPreview.
 * @throws httpError 404 si la propiedad no existe; 400 si fechas o guests son inválidos o superan capacidad.
 *
 * @example
 * const preview = getBookingPreview('prop-1', '2025-03-01', '2025-03-05', 2)
 * // preview.available && preview.totalPrice para mostrar al usuario
 */
export function getBookingPreview(propertyId: string, checkIn: string, checkOut: string, guests: number) {
  const property = memoryGetPropertyById(propertyId)
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

  const available = isPropertyAvailable(propertyId, checkIn, checkOut)
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
 *
 * @param userId - Id del usuario.
 * @returns Lista de reservas (del store en memoria).
 */
export function listMyBookings(userId: string) {
  return memoryListBookingsByUser(userId)
}

/**
 * Obtiene una reserva por id si pertenece al usuario; si no, lanza error.
 *
 * @param userId - Id del usuario (para comprobar propiedad).
 * @param bookingId - Id de la reserva.
 * @returns La reserva.
 * @throws httpError 404 si no existe la reserva; 403 si no es del usuario.
 */
export function getMyBookingByIdOrThrow(userId: string, bookingId: string) {
  const booking = memoryGetBookingById(bookingId)
  if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Booking not found')
  if (booking.userId !== userId) throw httpError(403, 'FORBIDDEN', 'Not allowed')
  return booking
}

/**
 * Crea una reserva: valida propiedad, fechas, huéspedes y disponibilidad; persiste y notifica al host.
 *
 * @param userId - Id del usuario que reserva.
 * @param input - propertyId, checkIn, checkOut, guests.
 * @returns La reserva creada (status 'confirmed').
 * @throws httpError 400 por validación; 404 propiedad no encontrada; 409 si no está disponible en esas fechas.
 */
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
    throw httpError(400, 'GUESTS_EXCEED_MAX', 'Number of guests exceeds property capacity')
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

/**
 * Cancela una reserva del usuario. Si ya estaba cancelada, la devuelve sin cambios. Notifica al host.
 *
 * @param userId - Id del usuario (debe ser el dueño de la reserva).
 * @param bookingId - Id de la reserva.
 * @returns La reserva actualizada (status 'cancelled') o la misma si ya estaba cancelada.
 * @throws httpError 404 si no existe la reserva; 403 si no es del usuario.
 */
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

/**
 * Indica si la reserva se considera completada (checkOut ya pasó y no está cancelada).
 *
 * @param booking - Reserva con checkOut en string.
 * @returns true si la fecha de salida ya pasó y no está cancelada.
 */
export function isBookingCompleted(booking: Booking) {
  if (booking.status === 'cancelled') return false
  const out = parseDate(booking.checkOut)
  if (!out) return false
  return Date.now() > out.getTime()
}

/**
 * Normaliza el estado de la reserva para la API: si ya pasó el checkOut se considera 'completed'.
 *
 * @param booking - Reserva.
 * @returns 'cancelled' | 'completed' | o el status original (p. ej. 'confirmed').
 */
export function normalizeBookingStatus(booking: Booking): BookingStatus {
  // Para el milestone, consideramos "completed" cuando ya pasó el checkOut.
  if (booking.status === 'cancelled') return 'cancelled'
  return isBookingCompleted(booking) ? 'completed' : booking.status
}

