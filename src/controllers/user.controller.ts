import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { isValidEmail } from '../utils/validation'
import {
  deleteUserById,
  findUserByEmail,
  findUserById,
  getUserId,
  toPublicUser,
  updateUserProfile,
} from '../services/auth.service'
import { memoryListBookingsByUser } from '../store/memoryBookings'
import { memoryListPropertiesByHost } from '../store/memoryProperties'

export async function getMe(req: Request, res: Response) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const user = await findUserById(userId)
  if (!user) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const stats = {
    propertiesCount: memoryListPropertiesByHost(userId).length,
    bookingsCount: memoryListBookingsByUser(userId).length,
  }

  res.json({ user: toPublicUser(user), stats })
}

export async function updateMe(req: Request, res: Response) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const hasFullName = req.body?.fullName !== undefined
  const hasEmail = req.body?.email !== undefined
  const hasAvatarUrl = req.body?.avatarUrl !== undefined
  if (!hasFullName && !hasEmail && !hasAvatarUrl) {
    throw httpError(400, 'VALIDATION_ERROR', 'At least one field is required')
  }

  const patch: { fullName?: string; email?: string; avatarUrl?: string } = {}

  if (hasFullName) {
    const fullName = String(req.body?.fullName || '').trim()
    if (!fullName) throw httpError(400, 'VALIDATION_ERROR', 'fullName is required')
    patch.fullName = fullName
  }

  if (hasEmail) {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email || !isValidEmail(email)) throw httpError(400, 'VALIDATION_ERROR', 'email is invalid')

    const existing = await findUserByEmail(email)
    if (existing && getUserId(existing) !== userId) {
      throw httpError(409, 'EMAIL_IN_USE', 'Email already registered')
    }

    patch.email = email
  }

  if (hasAvatarUrl) {
    const avatarUrl = String(req.body?.avatarUrl || '').trim()
    patch.avatarUrl = avatarUrl
  }

  const updated = await updateUserProfile(userId, patch)
  if (!updated) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  res.json({ user: toPublicUser(updated) })
}

export async function deleteMe(req: Request, res: Response) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const ok = await deleteUserById(userId)
  if (!ok) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  res.json({ ok: true })
}

