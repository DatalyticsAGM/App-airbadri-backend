import type { Express } from 'express'
import { authRoutes } from './auth.routes'

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRoutes())
}

