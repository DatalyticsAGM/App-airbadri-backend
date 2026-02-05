import type { UserForService } from '../types'
import {
  memoryCreateUser,
  memoryDeleteUser,
  memoryFindUserByEmail,
  memoryFindUserById,
  memoryFindUserByValidResetToken,
  memoryResetPassword,
  memorySetResetPasswordToken,
  memoryUpdateUser,
  memoryResetForDev,
} from '../../store/memoryUsers'
import type { IUserRepository } from '../types'

function toUserForService(u: { id: string; fullName: string; email: string; avatarUrl?: string; role?: string; passwordHash: string; resetPasswordTokenHash?: string; resetPasswordExpiresAt?: Date }): UserForService {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    avatarUrl: u.avatarUrl,
    role: u.role ?? 'user',
    passwordHash: u.passwordHash,
    resetPasswordTokenHash: u.resetPasswordTokenHash,
    resetPasswordExpiresAt: u.resetPasswordExpiresAt,
  }
}

export function createMemoryUserRepository(): IUserRepository {
  return {
    async create(params) {
      const u = memoryCreateUser({ ...params, role: params.role })
      return toUserForService(u)
    },
    async findByEmail(email: string) {
      const u = memoryFindUserByEmail(email)
      return u ? toUserForService(u) : null
    },
    async findById(id: string) {
      const u = memoryFindUserById(id)
      return u ? toUserForService(u) : null
    },
    async update(userId: string, patch) {
      const u = memoryUpdateUser(userId, patch)
      return u ? toUserForService(u) : null
    },
    async delete(userId: string) {
      return memoryDeleteUser(userId)
    },
    async setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
      memorySetResetPasswordToken(userId, token, expiresAt)
    },
    async findByValidResetToken(token: string) {
      const u = memoryFindUserByValidResetToken(token)
      return u ? toUserForService(u) : null
    },
    async resetPassword(userId: string, newPasswordHash: string) {
      memoryResetPassword(userId, newPasswordHash)
    },
  }
}

export function getMemoryUserReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
