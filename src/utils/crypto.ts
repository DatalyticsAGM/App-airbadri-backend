import crypto from 'crypto'

/**
 * Utilidad para hash SHA-256. Usado en auth (tokens de reset) y store memoryUsers.
 *
 * @param input - Texto a hashear.
 * @returns Hash en hexadecimal.
 */
export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}
