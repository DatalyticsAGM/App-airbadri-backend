import type { Express } from 'express'
import { authRoutes } from './auth.routes'
import { bookingsRoutes } from './bookings.routes'
import { favoritesRoutes } from './favorites.routes'
import { hostRoutes } from './host.routes'
import { notificationsRoutes } from './notifications.routes'
import { propertiesRoutes } from './properties.routes'
import { reviewsRoutes } from './reviews.routes'
import { searchRoutes } from './search.routes'
import { usersRoutes } from './users.routes'

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRoutes())
  app.use('/api/bookings', bookingsRoutes())
  app.use('/api/favorites', favoritesRoutes())
  app.use('/api/host', hostRoutes())
  app.use('/api/notifications', notificationsRoutes())
  app.use('/api/properties', propertiesRoutes())
  app.use('/api/reviews', reviewsRoutes())
  app.use('/api/search', searchRoutes())
  app.use('/api/users', usersRoutes())
}

