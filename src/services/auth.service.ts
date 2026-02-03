/**
 * Módulo auth.service (servicio de autenticación).
 *
 * Contiene la lógica de negocio de autenticación: registro, login, tokens JWT,
 * reset de contraseña y perfil de usuario. Usa el modelo User cuando MongoDB está
 * disponible; si no, delega en el store en memoria (memoryUsers).
 * Dependencias: config/env, models/User, store/memoryUsers, bcryptjs, jsonwebtoken, crypto.
 */
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import mongoose from 'mongoose'

import { env } from '../config/env'
import { User, type UserDoc } from '../models/User'
import { sha256 } from '../utils/crypto'
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

/**
 * Usuario en formato seguro para enviar al cliente (sin contraseña ni tokens).
 *
 * @property id - Identificador del usuario (string).
 * @property fullName - Nombre completo.
 * @property email - Correo electrónico.
 * @property avatarUrl - URL del avatar (opcional; solo si el store lo soporta).
 */
export type PublicUser = { id: string; fullName: string; email: string; avatarUrl?: string }

type StoredUser = UserDoc | MemoryUser

function isDbReady() {
  if (env.USE_MEMORY_ONLY) return false
  return mongoose.connection.readyState === 1
}

/**
 * Obtiene el id del usuario como string, tanto si viene de MongoDB (_id) como del store en memoria (id).
 *
 * @param user - Usuario en formato documento o memoria.
 * @returns Id del usuario como string.
 */
export function getUserId(user: StoredUser) {
  return '_id' in user ? user._id.toString() : user.id
}

/**
 * Convierte un usuario almacenado (DB o memoria) a la forma pública segura para el cliente.
 *
 * @param user - Usuario en formato documento o memoria.
 * @returns Objeto PublicUser (id, fullName, email, avatarUrl opcional).
 */
export function toPublicUser(user: StoredUser): PublicUser {
  const avatarUrl = 'avatarUrl' in user ? user.avatarUrl : undefined
  return { id: getUserId(user), fullName: user.fullName, email: user.email, avatarUrl }
}

/**
 * Genera un hash de la contraseña con bcrypt (salt de 10 rondas).
 * Hash: resultado irreversible de una función criptográfica; permite comparar contraseñas sin guardarlas en claro.
 *
 * @param password - Contraseña en texto plano.
 * @returns Promesa con el hash en string.
 */
export async function hashPassword(password: string) {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Comprueba si la contraseña en texto plano coincide con el hash guardado.
 *
 * @param password - Contraseña en texto plano.
 * @param passwordHash - Hash guardado (p. ej. de User.passwordHash).
 * @returns Promesa con true si coinciden, false si no.
 */
export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

/**
 * Genera un JWT (JSON Web Token) para el usuario. El token incluye el userId en el claim "sub"
 * y caduca según env.JWT_EXPIRES_IN (p. ej. "7d").
 *
 * @param userId - Id del usuario.
 * @returns Token JWT en string.
 */
export function signAccessToken(userId: string) {
  // jsonwebtoken v9 tipa expiresIn con un "StringValue" (p.ej. "7d").
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn })
}

/**
 * Calcula el hash SHA-256 de una cadena (p. ej. para guardar el token de reset sin guardar el token en claro).
 * Re-exportado desde utils/crypto para uso en auth y stores.
 *
 * @param input - Texto a hashear.
 * @returns Hash en hexadecimal.
 */
export { sha256 } from '../utils/crypto'

/**
 * Genera un token aleatorio para el flujo de restablecimiento de contraseña.
 * En producción este token se enviaría por email; aquí es solo un string aleatorio.
 *
 * @returns Token en hexadecimal (64 caracteres).
 */
export function generateResetToken() {
  // Token corto y simple para dev. En prod se envía por email.
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Crea un nuevo usuario: hashea la contraseña y lo persiste en memoria o en MongoDB según disponibilidad.
 *
 * @param params - fullName, email y password en texto plano.
 * @returns Promesa con el documento de usuario creado (UserDoc o equivalente en memoria).
 */
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

/**
 * Busca un usuario por email (normalizado a minúsculas). Usa memoria o MongoDB según isDbReady().
 *
 * @param email - Correo del usuario.
 * @returns Promesa con el usuario o null si no existe.
 */
export async function findUserByEmail(email: string) {
  if (!isDbReady()) return memoryFindUserByEmail(email)
  return User.findOne({ email: email.toLowerCase() })
}

/**
 * Busca un usuario por id. Usa memoria o MongoDB según isDbReady().
 *
 * @param id - Id del usuario (string).
 * @returns Promesa con el usuario o null si no existe.
 */
export async function findUserById(id: string) {
  if (!isDbReady()) return memoryFindUserById(id)
  return User.findById(id)
}

/**
 * Guarda en el usuario el hash del token de reset y su fecha de expiración.
 *
 * @param userId - Id del usuario.
 * @param token - Token en texto plano (se guarda solo su hash SHA-256).
 * @param expiresAt - Fecha hasta la cual el token es válido.
 */
export async function setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
  if (!isDbReady()) return memorySetResetPasswordToken(userId, token, expiresAt)

  await User.updateOne(
    { _id: userId },
    { $set: { resetPasswordTokenHash: sha256(token), resetPasswordExpiresAt: expiresAt } }
  )
}

/**
 * Busca un usuario cuyo token de reset coincida (por hash) y no haya expirado.
 *
 * @param token - Token en texto plano enviado por el usuario.
 * @returns Promesa con el usuario o null si no hay ninguno válido.
 */
export async function findUserByValidResetToken(token: string) {
  if (!isDbReady()) return memoryFindUserByValidResetToken(token)

  const now = new Date()
  return User.findOne({
    resetPasswordTokenHash: sha256(token),
    resetPasswordExpiresAt: { $gt: now },
  })
}

/**
 * Actualiza la contraseña del usuario y elimina el token de reset.
 *
 * @param userId - Id del usuario.
 * @param newPassword - Nueva contraseña en texto plano (se hashea antes de guardar).
 */
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

/**
 * Actualiza parcialmente el perfil del usuario (nombre, email, avatar). Solo aplica campos presentes en patch.
 *
 * @param userId - Id del usuario.
 * @param patch - Objeto con fullName, email y/o avatarUrl opcionales.
 * @returns Promesa con el documento actualizado (new: true) o el equivalente en memoria.
 */
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

/**
 * Elimina un usuario por id. Usa memoria o MongoDB según isDbReady().
 *
 * @param userId - Id del usuario a eliminar.
 * @returns Promesa con true si se eliminó, false si no existía.
 */
export async function deleteUserById(userId: string) {
  if (!isDbReady()) return memoryDeleteUser(userId)

  const deleted = await User.findByIdAndDelete(userId)
  return Boolean(deleted)
}

