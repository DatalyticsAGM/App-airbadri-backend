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

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  registerRoutes(app)

  // 404 simple
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } })
  })

  app.use(errorHandler)

  return app
}
