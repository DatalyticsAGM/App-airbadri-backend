/**
 * Seed interactivo para DESARROLLO.
 *
 * Objetivo:
 * - Verificar conexión real a MongoDB (ping).
 * - Preguntar confirmación en cada paso.
 * - Crear al menos 1 registro por colección: users, properties, bookings, favorites, reviews, notifications.
 *
 * ALERTA:
 * - Este script puede BORRAR datos si lo confirmas.
 * - Crea usuarios con contraseña conocida (datos "comprometidos" / no seguros).
 *
 * Uso recomendado (sin dependencias nuevas):
 * - npm run seed:interactive
 */
import '../config/dotenv'

import mongoose from 'mongoose'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

import { connectDb } from '../config/db'
import { assertEnv, env } from '../config/env'

const DEFAULT_SEED_PASSWORD = '123456'

function printCompromisedAlert(message: string) {
  // Mensaje visible y repetible. Pediste “siempre” alertar cuando haya riesgo/compromiso.
  console.warn('\n==================== ALERTA ====================')
  console.warn(message)
  console.warn('================================================\n')
}

async function confirmYesNo(rl: ReturnType<typeof createInterface>, question: string): Promise<boolean> {
  const answer = (await rl.question(`${question} (y/N): `)).trim().toLowerCase()
  return answer === 'y' || answer === 'yes'
}

async function confirmDangerByTyping(
  rl: ReturnType<typeof createInterface>,
  message: string,
  phrase: string
): Promise<boolean> {
  printCompromisedAlert(message)
  const answer = (await rl.question(`Escribe "${phrase}" para confirmar (o Enter para cancelar): `)).trim()
  return answer === phrase
}

async function ensureMongoConnectionOrExit(rl: ReturnType<typeof createInterface>) {
  assertEnv()

  if (!env.MONGO_URI) {
    printCompromisedAlert(
      'No hay MONGO_URI en el entorno. No se puede verificar conexión real a MongoDB.\n' +
        'Solución: define MONGO_URI en .env.'
    )
    process.exitCode = 1
    return { ok: false as const }
  }

  if (env.USE_MEMORY_ONLY) {
    printCompromisedAlert(
      'USE_MEMORY_ONLY está activado. Este seed interactivo está diseñado para MongoDB real.\n' +
        'Solución: desactiva USE_MEMORY_ONLY para ejecutar este seed sobre MongoDB.'
    )
    process.exitCode = 1
    return { ok: false as const }
  }

  if (!(await confirmYesNo(rl, '1) Conectar a MongoDB y verificar ping'))) {
    return { ok: false as const }
  }

  const conn = await connectDb(env.MONGO_URI)
  if (!conn.db) {
    throw new Error('Conexión a MongoDB iniciada, pero "conn.db" no está disponible para hacer ping.')
  }
  await conn.db.admin().ping()

  console.log('OK: MongoDB conectado y ping exitoso.')
  return { ok: true as const }
}

async function maybeWipeCollections(rl: ReturnType<typeof createInterface>) {
  const shouldWipe = await confirmYesNo(rl, '2) ¿Quieres borrar datos existentes antes del seed? (recomendado en DEV)')
  if (!shouldWipe) return

  const confirmed = await confirmDangerByTyping(
    rl,
    'Vas a BORRAR datos de la base.\n' +
      'Esto elimina documentos en: users, properties, bookings, favorites, reviews, notifications.\n' +
      'Si estás en una base compartida o con datos reales, DETENTE.',
    'BORRAR'
  )
  if (!confirmed) {
    console.log('Cancelado: no se borraron datos.')
    return
  }

  // Importar modelos DESPUÉS de conectar.
  const { User } = await import('../models/User')
  const { Property } = await import('../models/Property')
  const { Booking } = await import('../models/Booking')
  const { Favorite } = await import('../models/Favorite')
  const { Review } = await import('../models/Review')
  const { Notification } = await import('../models/Notification')

  await Promise.all([
    Notification.deleteMany({}),
    Review.deleteMany({}),
    Favorite.deleteMany({}),
    Booking.deleteMany({}),
    Property.deleteMany({}),
    User.deleteMany({}),
  ])

  console.log('OK: colecciones limpiadas.')
}

async function seedUsers(rl: ReturnType<typeof createInterface>) {
  if (!(await confirmYesNo(rl, '3) Crear usuarios (1 admin, 1 host, 1 user)'))) return null

  printCompromisedAlert(
    'Se crearán usuarios con credenciales conocidas para desarrollo.\n' +
      `Contraseña seed por defecto: "${DEFAULT_SEED_PASSWORD}".\n` +
      'No uses estas credenciales en producción.'
  )

  // Importar servicios/repos DESPUÉS de conectar para forzar repos mongo.
  const { createUser, getUserId } = await import('../services/auth.service')

  const admin = await createUser({
    fullName: 'Admin Demo',
    email: 'admin@example.com',
    password: DEFAULT_SEED_PASSWORD,
    role: 'admin',
  })
  const host = await createUser({
    fullName: 'Host Demo',
    email: 'host@example.com',
    password: DEFAULT_SEED_PASSWORD,
    role: 'host',
  })
  const guest = await createUser({
    fullName: 'Usuario Demo',
    email: 'user@example.com',
    password: DEFAULT_SEED_PASSWORD,
    role: 'user',
  })

  const adminId = getUserId(admin)
  const hostId = getUserId(host)
  const guestId = getUserId(guest)

  console.log('OK: usuarios creados:', { adminId, hostId, guestId })
  return { adminId, hostId, guestId }
}

async function seedProperty(rl: ReturnType<typeof createInterface>, hostId: string) {
  if (!(await confirmYesNo(rl, '4) Crear propiedades (mínimo 1)'))) return null

  const { propertyRepository } = await import('../repositories')

  const property = await propertyRepository.create({
    hostId,
    title: 'Propiedad demo (seed)',
    description: 'Descripción demo para desarrollo.',
    location: 'Buenos Aires, AR',
    pricePerNight: 100,
    images: ['https://picsum.photos/seed/airbnb-seed/1200/800'],
    amenities: ['wifi', 'kitchen'],
    propertyType: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
  })

  console.log('OK: propiedad creada:', { propertyId: property.id })
  return property
}

async function seedRemainingCollections(
  rl: ReturnType<typeof createInterface>,
  params: { propertyId: string; guestId: string }
) {
  if (!(await confirmYesNo(rl, '5) Crear 1 booking + 1 favorite + 1 review + 1 notification'))) return null

  const { bookingRepository, favoriteRepository, reviewRepository, notificationRepository } = await import('../repositories')

  const booking = await bookingRepository.create({
    propertyId: params.propertyId,
    userId: params.guestId,
    checkIn: '2026-03-10',
    checkOut: '2026-03-12',
    guests: 2,
    totalPrice: 200,
    status: 'confirmed',
  })

  const favorite = await favoriteRepository.add(params.guestId, params.propertyId)

  const review = await reviewRepository.create({
    propertyId: params.propertyId,
    userId: params.guestId,
    rating: 5,
    comment: 'Todo excelente (seed).',
    date: new Date().toISOString(),
    userName: 'Guest Demo',
  })

  const notification = await notificationRepository.create({
    userId: params.guestId,
    type: 'info',
    title: 'Seed listo',
    message: 'Tu base fue inicializada correctamente.',
    read: false,
    date: new Date().toISOString(),
    link: `/properties/${params.propertyId}`,
  })

  console.log('OK: registros creados:', {
    bookingId: booking.id,
    favoriteId: favorite.id,
    reviewId: review.id,
    notificationId: notification.id,
  })

  return { booking, favorite, review, notification }
}

async function main() {
  const rl = createInterface({ input, output })

  try {
    const connected = await ensureMongoConnectionOrExit(rl)
    if (!connected.ok) return

    await maybeWipeCollections(rl)

    const users = await seedUsers(rl)
    if (!users) return

    const property = await seedProperty(rl, users.hostId)
    if (!property) return

    await seedRemainingCollections(rl, { propertyId: property.id, guestId: users.guestId })

    printCompromisedAlert(
      'Seed completado.\n' +
        'Recuerda: estos datos son de desarrollo (emails públicos + contraseña conocida).\n' +
        'Si esta base no es de DEV, considera borrar inmediatamente lo insertado.'
    )
  } finally {
    rl.close()
    await mongoose.disconnect().catch(() => {})
  }
}

main().catch((err) => {
  console.error('Seed falló:', err)
  process.exitCode = 1
})

