import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import mongoose from 'mongoose'

import { env } from '../config/env'
import { User, type UserDoc } from '../models/User'
import {
  memoryCreateUser,
  memoryDeleteUser,
  memoryFindUserByEmail,
  memoryFindUserById,
  memoryFindUserByValidResetToken,
  memoryResetPassword,
  memorySetResetPasswordToken,
  memoryUpdateUser,
  type MemoryUser,
} from '../store/memoryUsers'

export type PublicUser = { id: string; fullName: string; email: string; avatarUrl?: string }

type StoredUser = UserDoc | MemoryUser

function isDbReady() {
  if (env.USE_MEMORY_ONLY) return false
  return mongoose.connection.readyState === 1
}

export function getUserId(user: StoredUser) {
  return '_id' in user ? user._id.toString() : user.id
}

export function toPublicUser(user: StoredUser): PublicUser {
  const avatarUrl = 'avatarUrl' in user ? (user as any).avatarUrl : undefined
  return { id: getUserId(user), fullName: user.fullName, email: user.email, avatarUrl }
}

export async function hashPassword(password: string) {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function signAccessToken(userId: string) {
  // jsonwebtoken v9 tipa expiresIn con un "StringValue" (p.ej. "7d").
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn })
}

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function generateResetToken() {
  // Token corto y simple para dev. En prod se envía por email.
  return crypto.randomBytes(32).toString('hex')
}

export async function createUser(params: { fullName: string; email: string; password: string }) {
  const passwordHash = await hashPassword(params.password)

  if (!isDbReady()) {
    return memoryCreateUser({
      fullName: params.fullName,
      email: params.email.toLowerCase(),
      passwordHash,
    })
  }

  return User.create({
    fullName: params.fullName,
    email: params.email.toLowerCase(),
    passwordHash,
  })
}

export async function findUserByEmail(email: string) {
  if (!isDbReady()) return memoryFindUserByEmail(email)
  return User.findOne({ email: email.toLowerCase() })
}

export async function findUserById(id: string) {
  if (!isDbReady()) return memoryFindUserById(id)
  return User.findById(id)
}

export async function setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
  if (!isDbReady()) return memorySetResetPasswordToken(userId, token, expiresAt)

  await User.updateOne(
    { _id: userId },
    { $set: { resetPasswordTokenHash: sha256(token), resetPasswordExpiresAt: expiresAt } }
  )
}

export async function findUserByValidResetToken(token: string) {
  if (!isDbReady()) return memoryFindUserByValidResetToken(token)

  const now = new Date()
  return User.findOne({
    resetPasswordTokenHash: sha256(token),
    resetPasswordExpiresAt: { $gt: now },
  })
}

export async function resetPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)

  if (!isDbReady()) return memoryResetPassword(userId, passwordHash)

  await User.updateOne(
    { _id: userId },
    {
      $set: { passwordHash },
      $unset: { resetPasswordTokenHash: 1, resetPasswordExpiresAt: 1 },
    }
  )
}

export async function updateUserProfile(
  userId: string,
  patch: { fullName?: string; email?: string; avatarUrl?: string }
) {
  if (!isDbReady()) {
    return memoryUpdateUser(userId, patch)
  }

  const $set: { fullName?: string; email?: string; avatarUrl?: string } = {}
  if (typeof patch.fullName === 'string') $set.fullName = patch.fullName
  if (typeof patch.email === 'string') $set.email = patch.email.toLowerCase()
  if (typeof patch.avatarUrl === 'string') $set.avatarUrl = patch.avatarUrl

  return User.findByIdAndUpdate(userId, { $set }, { new: true })
}

export async function deleteUserById(userId: string) {
  if (!isDbReady()) return memoryDeleteUser(userId)

  const deleted = await User.findByIdAndDelete(userId)
  return Boolean(deleted)
}

