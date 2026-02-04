import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import { env } from './config/env'
import { registerRoutes } from './routes'
import { devRoutes } from './routes/dev.routes'
import { errorHandler } from './middlewares/errorHandler'

const API_VERSION = '1.0.0'

function isDevMode() {
  return env.USE_MEMORY_ONLY || process.env.NODE_ENV === 'development'
}

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
      version: API_VERSION,
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        properties: '/api/properties',
        bookings: '/api/bookings',
        reviews: '/api/reviews',
        notifications: '/api/notifications',
        favorites: '/api/favorites',
        host: '/api/host',
        hostDashboard: 'GET /api/host/dashboard',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        forgotPassword: 'POST /api/auth/forgot-password',
        resetPassword: 'POST /api/auth/reset-password',
        verify: 'GET /api/auth/verify',
      },
    })
  })

  app.get('/api/info', (_req, res) => {
    res.json({
      version: API_VERSION,
      memoryOnly: env.USE_MEMORY_ONLY,
      env: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    })
  })

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.get('/ready', (_req, res) => {
    const mongoConnected = mongoose.connection.readyState === 1
    const memoryOnly = env.USE_MEMORY_ONLY
    res.json({
      ok: true,
      ready: true,
      ...(memoryOnly ? {} : { mongo: mongoConnected ? 'connected' : 'disconnected' }),
    })
  })

  registerRoutes(app)

  if (isDevMode()) {
    app.use('/api/dev', devRoutes())
  }

  // 404 simple
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
  })

  app.use(errorHandler)

  return app
}
