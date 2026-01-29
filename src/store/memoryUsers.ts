import crypto from 'crypto'

export type MemoryUser = {
  id: string
  fullName: string
  email: string
  passwordHash: string
  resetPasswordTokenHash?: string
  resetPasswordExpiresAt?: Date
}

const usersById = new Map<string, MemoryUser>()
const usersByEmail = new Map<string, string>() // email -> id

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function memoryCreateUser(params: {
  fullName: string
  email: string
  passwordHash: string
}): MemoryUser {
  const id = crypto.randomUUID()
  const user: MemoryUser = {
    id,
    fullName: params.fullName,
    email: params.email.toLowerCase(),
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

