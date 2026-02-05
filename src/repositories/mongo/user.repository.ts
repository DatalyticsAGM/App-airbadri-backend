import { User } from '../../models/User'
import { sha256 } from '../../utils/crypto'
import type { IUserRepository, UserForService } from '../types'

type UserDoc = {
  _id: { toString(): string }
  fullName: string
  email: string
  avatarUrl?: string
  role?: string
  passwordHash: string
  resetPasswordTokenHash?: string
  resetPasswordExpiresAt?: Date
}

function toUserForService(doc: UserDoc): UserForService {
  return {
    id: doc._id.toString(),
    fullName: doc.fullName,
    email: doc.email,
    avatarUrl: doc.avatarUrl,
    role: doc.role ?? 'user',
    passwordHash: doc.passwordHash,
    resetPasswordTokenHash: doc.resetPasswordTokenHash,
    resetPasswordExpiresAt: doc.resetPasswordExpiresAt,
  }
}

export function createUserRepository(): IUserRepository {
  return {
    async create(params) {
      const requestedRole = params.role === 'admin' || params.role === 'host' ? params.role : 'user'

      // Regla de negocio: solo puede existir 1 admin. Si ya existe, se reutiliza.
      if (requestedRole === 'admin') {
        const existingAdmin = await User.findOne({ role: 'admin' }).lean()
        if (existingAdmin) return toUserForService(existingAdmin as UserDoc)
      }

      const role = requestedRole
      const doc = await User.create({
        fullName: params.fullName,
        email: params.email.toLowerCase(),
        passwordHash: params.passwordHash,
        role,
      })
      return toUserForService(doc as UserDoc)
    },

    async findByEmail(email: string) {
      const doc = await User.findOne({ email: email.toLowerCase() }).lean()
      if (!doc) return null
      return toUserForService(doc as UserDoc)
    },

    async findById(id: string) {
      const doc = await User.findById(id).lean()
      if (!doc) return null
      return toUserForService(doc as UserDoc)
    },

    async update(userId: string, patch) {
      const $set: { fullName?: string; email?: string; avatarUrl?: string; role?: string } = {}
      if (typeof patch.fullName === 'string') $set.fullName = patch.fullName
      if (typeof patch.email === 'string') $set.email = patch.email.toLowerCase()
      if (typeof patch.avatarUrl === 'string') $set.avatarUrl = patch.avatarUrl
      if (patch.role === 'admin' || patch.role === 'host' || patch.role === 'user') $set.role = patch.role
      const doc = await User.findByIdAndUpdate(userId, { $set }, { new: true }).lean()
      if (!doc) return null
      return toUserForService(doc as UserDoc)
    },

    async delete(userId: string) {
      const deleted = await User.findByIdAndDelete(userId)
      return Boolean(deleted)
    },

    async setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
      await User.updateOne(
        { _id: userId },
        { $set: { resetPasswordTokenHash: sha256(token), resetPasswordExpiresAt: expiresAt } }
      )
    },

    async findByValidResetToken(token: string) {
      const doc = await User.findOne({
        resetPasswordTokenHash: sha256(token),
        resetPasswordExpiresAt: { $gt: new Date() },
      }).lean()
      if (!doc) return null
      return toUserForService(doc as UserDoc)
    },

    async resetPassword(userId: string, newPasswordHash: string) {
      await User.updateOne(
        { _id: userId },
        { $set: { passwordHash: newPasswordHash }, $unset: { resetPasswordTokenHash: 1, resetPasswordExpiresAt: 1 } }
      )
    },
  }
}
