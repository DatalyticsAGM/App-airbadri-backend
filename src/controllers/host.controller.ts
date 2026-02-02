import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { memoryListBookings } from '../store/memoryBookings'
import { memoryListPropertiesByHost } from '../store/memoryProperties'
import { memoryListReviewsByProperty } from '../store/memoryReviews'
import { getMyNotifications, getUnreadCount } from '../services/notifications.service'
import { normalizeBookingStatus } from '../services/bookings.service'

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

export async function hostDashboardHandler(req: Request, res: Response) {
  const hostId = requireUserId(req)

  const properties = memoryListPropertiesByHost(hostId)
  const propertyIds = new Set(properties.map((p) => p.id))

  const allBookings = memoryListBookings()
  const hostBookings = allBookings
    .filter((b) => propertyIds.has(b.propertyId))
    .map((b) => ({ ...b, status: normalizeBookingStatus(b) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const bookingsCount = hostBookings.length
  const earningsTotal = hostBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (Number(b.totalPrice) || 0), 0)

  const reviews = properties.flatMap((p) => memoryListReviewsByProperty(p.id))
  const reviewsCount = reviews.length
  const averageRating =
    reviewsCount === 0 ? 0 : Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount) * 10) / 10

  const notifications = getMyNotifications(hostId)
  const unreadNotifications = getUnreadCount(hostId)

  res.json({
    stats: {
      propertiesCount: properties.length,
      bookingsCount,
      reviewsCount,
      averageRating,
      earningsTotal,
      unreadNotifications,
    },
    recentBookings: hostBookings.slice(0, 5),
    recentReviews: reviews
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5),
    notifications: notifications.slice(0, 10),
  })
}

