import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { env } from '../config/env'
import { User, type UserDoc } from '../models/User'

export type PublicUser = { id: string; fullName: string; email: string }

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
  }
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
  const user = await User.create({
    fullName: params.fullName,
    email: params.email.toLowerCase(),
    passwordHash,
  })
  return user
}

export async function findUserByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase() })
}

export async function findUserById(id: string) {
  return User.findById(id)
}

export async function setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
  await User.updateOne(
    { _id: userId },
    { $set: { resetPasswordTokenHash: sha256(token), resetPasswordExpiresAt: expiresAt } }
  )
}

export async function findUserByValidResetToken(token: string) {
  const now = new Date()
  return User.findOne({
    resetPasswordTokenHash: sha256(token),
    resetPasswordExpiresAt: { $gt: now },
  })
}

export async function resetPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)
  await User.updateOne(
    { _id: userId },
    {
      $set: { passwordHash },
      $unset: { resetPasswordTokenHash: 1, resetPasswordExpiresAt: 1 },
    }
  )
}

