/**
 * Módulo notifications.service (servicio de notificaciones).
 *
 * Lógica de negocio para crear notificaciones, listar las del usuario, contar no leídas
 * y marcar como leídas. Usa repositorios (memoria o MongoDB).
 */
import { httpError } from '../middlewares/errorHandler'
import { notificationRepository } from '../repositories'
import type { Notification, NotificationType } from '../store/memoryNotifications'

/**
 * Obtiene todas las notificaciones del usuario (más recientes primero).
 */
export async function getMyNotifications(userId: string) {
  return notificationRepository.getByUser(userId)
}

/**
 * Cuenta cuántas notificaciones tiene el usuario sin leer.
 */
export async function getUnreadCount(userId: string) {
  return notificationRepository.getUnreadCount(userId)
}

/**
 * Crea una notificación para un usuario (p. ej. reserva confirmada, nueva review).
 */
export async function createNotification(params: {
  userId: string
  type: NotificationType | string
  title: string
  message: string
  link?: string
}): Promise<Notification> {
  const title = String(params.title || '').trim()
  const message = String(params.message || '').trim()
  if (!title) throw httpError(400, 'VALIDATION_ERROR', 'title is required')
  if (!message) throw httpError(400, 'VALIDATION_ERROR', 'message is required')

  return notificationRepository.create({
    userId: params.userId,
    type: params.type,
    title,
    message,
    read: false,
    date: new Date().toISOString(),
    link: params.link,
  })
}

/**
 * Marca una notificación como leída. Solo si pertenece al usuario.
 */
export async function markAsRead(userId: string, notificationId: string) {
  const updated = await notificationRepository.markAsRead(userId, notificationId)
  if (!updated) throw httpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found')
  return updated
}

/**
 * Marca todas las notificaciones del usuario como leídas.
 */
export async function markAllAsRead(userId: string) {
  const count = await notificationRepository.markAllAsRead(userId)
  return { ok: true, count }
}
