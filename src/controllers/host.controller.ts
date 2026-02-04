import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { listMyProperties } from '../services/properties.service'
import { listBookingsByProperty, normalizeBookingStatus } from '../services/bookings.service'
import { listReviewsByProperty } from '../services/reviews.service'
import { getMyNotifications, getUnreadCount } from '../services/notifications.service'

function requireUserId(req: Request) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')
  return userId
}

/** Convierte Date, string ISO o undefined a timestamp; evita crash si createdAt no es Date. */
function toTimestamp(d: Date | string | undefined): number {
  if (!d) return 0
  if (d instanceof Date) return d.getTime()
  const t = new Date(d as string).getTime()
  return Number.isFinite(t) ? t : 0
}

export async function hostDashboardHandler(req: Request, res: Response) {
  const hostId = requireUserId(req)

  const properties = await listMyProperties(hostId)

  const allBookingsArrays = await Promise.all(properties.map((p) => listBookingsByProperty(p.id)))
  const hostBookings = allBookingsArrays
    .flat()
    .map((b) => ({ ...b, status: normalizeBookingStatus(b) }))
    .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))

  const reviewsArrays = await Promise.all(properties.map((p) => listReviewsByProperty(p.id)))
  const reviews = reviewsArrays.flatMap((r) => r.items)
  const reviewsCount = reviews.length
  const averageRating =
    reviewsCount === 0 ? 0 : Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount) * 10) / 10

  const [notifications, unreadNotifications] = await Promise.all([
    getMyNotifications(hostId),
    getUnreadCount(hostId),
  ])

  res.json({
    stats: {
      propertiesCount: properties.length,
      bookingsCount: hostBookings.length,
      reviewsCount,
      averageRating,
      earningsTotal: hostBookings
        .filter((b) => b.status !== 'cancelled')
        .reduce((acc, b) => acc + (Number(b.totalPrice) || 0), 0),
      unreadNotifications,
    },
    recentBookings: hostBookings.slice(0, 5),
    recentReviews: reviews
      .slice()
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
      .slice(0, 5),
    notifications: notifications.slice(0, 10),
  })
}
