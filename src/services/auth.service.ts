/**
 * Módulo auth.service (servicio de autenticación).
 *
 * Contiene la lógica de negocio de autenticación: registro, login, tokens JWT,
 * reset de contraseña y perfil de usuario. Usa el repositorio de usuarios (memoria o MongoDB).
 * Dependencias: config/env, repositories, bcryptjs, jsonwebtoken, crypto.
 */
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { env } from '../config/env'
import { userRepository } from '../repositories'
import type { UserForService } from '../repositories/types'

/**
 * Usuario en formato seguro para enviar al cliente (sin contraseña ni tokens).
 *
 * @property id - Identificador del usuario (string).
 * @property fullName - Nombre completo.
 * @property email - Correo electrónico.
 * @property role - Rol: user, host o admin.
 * @property avatarUrl - URL del avatar (opcional; solo si el store lo soporta).
 */
export type PublicUser = { id: string; fullName: string; email: string; role: string; avatarUrl?: string }

/**
 * Obtiene el id del usuario como string.
 *
 * @param user - Usuario en formato repositorio (UserForService).
 * @returns Id del usuario como string.
 */
export function getUserId(user: UserForService): string {
  return user.id
}

/**
 * Convierte un usuario almacenado a la forma pública segura para el cliente.
 *
 * @param user - Usuario en formato repositorio.
 * @returns Objeto PublicUser (id, fullName, email, avatarUrl opcional).
 */
export function toPublicUser(user: UserForService): PublicUser {
  return { id: user.id, fullName: user.fullName, email: user.email, role: user.role ?? 'user', avatarUrl: user.avatarUrl }
}

/**
 * Genera un hash de la contraseña con bcrypt (salt de 10 rondas).
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
 * @param passwordHash - Hash guardado.
 * @returns Promesa con true si coinciden, false si no.
 */
export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

/**
 * Genera un JWT para el usuario. El token incluye el userId en el claim "sub".
 *
 * @param userId - Id del usuario.
 * @returns Token JWT en string.
 */
export function signAccessToken(userId: string, role: string) {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions['expiresIn']
  const safeRole = role === 'admin' || role === 'host' ? role : 'user'
  return jwt.sign({ sub: userId, role: safeRole }, env.JWT_SECRET, { expiresIn })
}

/**
 * Hash SHA-256. Re-exportado desde utils/crypto.
 */
export { sha256 } from '../utils/crypto'

/**
 * Genera un token aleatorio para el flujo de restablecimiento de contraseña.
 *
 * @returns Token en hexadecimal (64 caracteres).
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Crea un nuevo usuario: hashea la contraseña y lo persiste vía repositorio.
 * Por defecto el rol es user (todos los que se registran). Solo el seed crea el único admin; host se puede asignar internamente.
 *
 * @param params - fullName, email, password y opcionalmente role (user | host | admin).
 * @returns Promesa con el usuario creado (UserForService).
 */
export async function createUser(params: { fullName: string; email: string; password: string; role?: string }) {
  const passwordHash = await hashPassword(params.password)
  return userRepository.create({
    fullName: params.fullName,
    email: params.email.toLowerCase(),
    passwordHash,
    role: params.role,
  })
}

/**
 * Busca un usuario por email (normalizado a minúsculas).
 *
 * @param email - Correo del usuario.
 * @returns Promesa con el usuario o null si no existe.
 */
export async function findUserByEmail(email: string) {
  return userRepository.findByEmail(email)
}

/**
 * Busca un usuario por id.
 *
 * @param id - Id del usuario (string).
 * @returns Promesa con el usuario o null si no existe.
 */
export async function findUserById(id: string) {
  return userRepository.findById(id)
}

/**
 * Guarda en el usuario el hash del token de reset y su fecha de expiración.
 *
 * @param userId - Id del usuario.
 * @param token - Token en texto plano (se guarda solo su hash SHA-256).
 * @param expiresAt - Fecha hasta la cual el token es válido.
 */
export async function setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
  return userRepository.setResetPasswordToken(userId, token, expiresAt)
}

/**
 * Busca un usuario cuyo token de reset coincida (por hash) y no haya expirado.
 *
 * @param token - Token en texto plano enviado por el usuario.
 * @returns Promesa con el usuario o null si no hay ninguno válido.
 */
export async function findUserByValidResetToken(token: string) {
  return userRepository.findByValidResetToken(token)
}

/**
 * Actualiza la contraseña del usuario y elimina el token de reset.
 *
 * @param userId - Id del usuario.
 * @param newPassword - Nueva contraseña en texto plano (se hashea antes de guardar).
 */
export async function resetPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)
  return userRepository.resetPassword(userId, passwordHash)
}

/**
 * Actualiza parcialmente el perfil del usuario (nombre, email, avatar).
 *
 * @param userId - Id del usuario.
 * @param patch - Objeto con fullName, email y/o avatarUrl opcionales.
 * @returns Promesa con el usuario actualizado o null.
 */
export async function updateUserProfile(
  userId: string,
  patch: { fullName?: string; email?: string; avatarUrl?: string }
) {
  return userRepository.update(userId, patch)
}

/**
 * Elimina un usuario por id.
 *
 * @param userId - Id del usuario a eliminar.
 * @returns Promesa con true si se eliminó, false si no existía.
 */
export async function deleteUserById(userId: string) {
  return userRepository.delete(userId)
}
