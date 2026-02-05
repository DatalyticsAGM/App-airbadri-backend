import crypto from 'crypto'

import { sha256 } from '../utils/crypto'

export type MemoryUser = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  role: string
  passwordHash: string
  resetPasswordTokenHash?: string
  resetPasswordExpiresAt?: Date
}

const usersById = new Map<string, MemoryUser>()
const usersByEmail = new Map<string, string>() // email -> id

export function memoryCreateUser(params: {
  fullName: string
  email: string
  passwordHash: string
  role?: string
}): MemoryUser {
  const requestedRole = params.role === 'admin' || params.role === 'host' ? params.role : 'user'

  // Regla de negocio: solo puede existir 1 admin. Si ya existe, se reutiliza.
  if (requestedRole === 'admin') {
    for (const u of usersById.values()) {
      if (u.role === 'admin') return u
    }
  }

  const id = crypto.randomUUID()
  const role = requestedRole
  const user: MemoryUser = {
    id,
    fullName: params.fullName,
    email: params.email.toLowerCase(),
    role,
    passwordHash: params.passwordHash,
  }

  usersById.set(id, user)
  usersByEmail.set(user.email, id)
  return user
}

export function memoryFindUserByEmail(email: string) {
  const id = usersByEmail.get(email.toLowerCase())
  if (!id) return null
  return usersById.get(id) || null
}

export function memoryFindUserById(id: string) {
  return usersById.get(id) || null
}

export function memoryUpdateUser(
  userId: string,
  patch: { fullName?: string; email?: string; avatarUrl?: string; role?: string }
): MemoryUser | null {
  const user = usersById.get(userId)
  if (!user) return null

  if (typeof patch.fullName === 'string') {
    user.fullName = patch.fullName
  }

  if (typeof patch.email === 'string') {
    const nextEmail = patch.email.toLowerCase()
    if (nextEmail !== user.email) {
      usersByEmail.delete(user.email)
      usersByEmail.set(nextEmail, userId)
      user.email = nextEmail
    }
  }

  if (typeof patch.avatarUrl === 'string') {
    user.avatarUrl = patch.avatarUrl
  }

  if (patch.role === 'admin' || patch.role === 'host' || patch.role === 'user') {
    user.role = patch.role
  }

  return user
}

export function memoryDeleteUser(userId: string) {
  const user = usersById.get(userId)
  if (!user) return false

  usersById.delete(userId)
  usersByEmail.delete(user.email)
  return true
}

export function memorySetResetPasswordToken(userId: string, token: string, expiresAt: Date) {
  const user = usersById.get(userId)
  if (!user) return

  user.resetPasswordTokenHash = sha256(token)
  user.resetPasswordExpiresAt = expiresAt
}

export function memoryFindUserByValidResetToken(token: string) {
  const tokenHash = sha256(token)
  const now = Date.now()

  for (const user of usersById.values()) {
    if (!user.resetPasswordTokenHash || !user.resetPasswordExpiresAt) continue
    if (user.resetPasswordTokenHash !== tokenHash) continue
    if (user.resetPasswordExpiresAt.getTime() <= now) continue
    return user
  }

  return null
}

export function memoryResetPassword(userId: string, newPasswordHash: string) {
  const user = usersById.get(userId)
  if (!user) return

  user.passwordHash = newPasswordHash
  delete user.resetPasswordTokenHash
  delete user.resetPasswordExpiresAt
}

/** Solo para uso en seed de desarrollo. Vacía todos los usuarios. */
export function memoryResetForDev() {
  usersById.clear()
  usersByEmail.clear()
}

