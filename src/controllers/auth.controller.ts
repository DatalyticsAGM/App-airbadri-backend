import type { Request, Response } from 'express'

import { httpError } from '../middlewares/errorHandler'
import { isValidEmail } from '../utils/validation'
import {
  createUser,
  findUserByEmail,
  findUserById,
  generateResetToken,
  getUserId,
  resetPassword,
  setResetPasswordToken,
  signAccessToken,
  toPublicUser,
  verifyPassword,
  findUserByValidResetToken,
} from '../services/auth.service'

export async function signup(req: Request, res: Response) {
  const fullName = String(req.body?.fullName || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!fullName) throw httpError(400, 'VALIDATION_ERROR', 'fullName is required')
  if (!email || !isValidEmail(email)) throw httpError(400, 'VALIDATION_ERROR', 'email is invalid')
  if (!password || password.length < 6)
    throw httpError(400, 'VALIDATION_ERROR', 'password must be at least 6 characters')

  const existing = await findUserByEmail(email)
  if (existing) throw httpError(409, 'EMAIL_IN_USE', 'Email already registered')

  const user = await createUser({ fullName, email, password })
  const accessToken = signAccessToken(getUserId(user))

  res.status(201).json({ user: toPublicUser(user), accessToken })
}

export async function login(req: Request, res: Response) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!email || !isValidEmail(email)) throw httpError(400, 'VALIDATION_ERROR', 'email is invalid')
  if (!password) throw httpError(400, 'VALIDATION_ERROR', 'password is required')

  const user = await findUserByEmail(email)
  if (!user) throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials')

  const accessToken = signAccessToken(getUserId(user))
  res.json({ user: toPublicUser(user), accessToken })
}

export async function me(req: Request, res: Response) {
  const userId = String((req as any).userId || '')
  if (!userId) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  const user = await findUserById(userId)
  if (!user) throw httpError(401, 'UNAUTHORIZED', 'Unauthorized')

  res.json({ user: toPublicUser(user) })
}

export async function logout(_req: Request, res: Response) {
  // JWT stateless: el frontend borra el token.
  res.json({ ok: true })
}

export async function forgotPassword(req: Request, res: Response) {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!email || !isValidEmail(email)) throw httpError(400, 'VALIDATION_ERROR', 'email is invalid')

  const user = await findUserByEmail(email)

  // Por seguridad, respondemos igual exista o no el usuario.
  if (!user) return res.json({ ok: true })

  const resetToken = generateResetToken()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
  await setResetPasswordToken(getUserId(user), resetToken, expiresAt)

  // Modo dev: se devuelve el token para que el frontend lo use (M1 contrato: ok + resetToken).
  res.json({ ok: true, resetToken, expiresAt: expiresAt.toISOString() })
}

export async function validateResetToken(req: Request, res: Response) {
  const token = String(req.query?.token || '').trim()
  if (!token) throw httpError(400, 'VALIDATION_ERROR', 'token is required')

  const user = await findUserByValidResetToken(token)
  if (!user) throw httpError(400, 'INVALID_TOKEN', 'Token is invalid or expired')

  res.json({ ok: true, expiresAt: user.resetPasswordExpiresAt?.toISOString() })
}

export async function resetPasswordWithToken(req: Request, res: Response) {
  const token = String(req.body?.token || '').trim()
  const password = String(req.body?.password || '')

  if (!token) throw httpError(400, 'VALIDATION_ERROR', 'token is required')
  if (!password || password.length < 6)
    throw httpError(400, 'VALIDATION_ERROR', 'password must be at least 6 characters')

  const user = await findUserByValidResetToken(token)
  if (!user) throw httpError(400, 'INVALID_TOKEN', 'Token is invalid or expired')

  await resetPassword(getUserId(user), password)
  res.json({ ok: true })
}

