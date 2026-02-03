import express from 'express'
import cors from 'cors'

import { env } from './config/env'
import { registerRoutes } from './routes'
import { errorHandler } from './middlewares/errorHandler'

export function createApp() {
  const app = express()

  app.use(express.json())

  // CORS: en dev permite tu frontend; si no se define, deja abierto.
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN || true,
      credentials: true,
    })
  )

  // Home: info rápida de la API (útil para comprobar que está viva)
  app.get('/', (_req, res) => {
    res.json({
      message: '🚀 Airbnb Backend API funcionando',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        properties: '/api/properties',
        bookings: '/api/bookings',
        reviews: '/api/reviews',
        notifications: '/api/notifications',
        favorites: '/api/favorites',
        host: '/api/host',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        verify: 'GET /api/auth/verify',
      },
    })
  })

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.get('/ready', (_req, res) => {
    res.json({ ok: true, ready: true })
  })

  registerRoutes(app)

  // 404 simple
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
  })

  app.use(errorHandler)

  return app
}
