/**
 * Módulo notifications.service (servicio de notificaciones).
 *
 * Lógica de negocio para crear notificaciones, listar las del usuario, contar no leídas
 * y marcar como leídas. Usa el store en memoria (memoryNotifications).
 * Dependencias: middlewares/errorHandler, store/memoryNotifications.
 */
import { httpError } from '../middlewares/errorHandler'
import {
  memoryCreateNotification,
  memoryGetNotificationsByUser,
  memoryGetUnreadCount,
  memoryMarkAllAsRead,
  memoryMarkAsRead,
  type Notification,
  type NotificationType,
} from '../store/memoryNotifications'

/**
 * Obtiene todas las notificaciones del usuario (ordenadas por fecha, las más recientes primero típicamente).
 *
 * @param userId - Id del usuario.
 * @returns Lista de notificaciones del store en memoria.
 */
export function getMyNotifications(userId: string) {
  return memoryGetNotificationsByUser(userId)
}

/**
 * Cuenta cuántas notificaciones tiene el usuario sin leer.
 *
 * @param userId - Id del usuario.
 * @returns Número de notificaciones no leídas.
 */
export function getUnreadCount(userId: string) {
  return memoryGetUnreadCount(userId)
}

/**
 * Crea una notificación para un usuario (p. ej. reserva confirmada, nueva review). Valida title y message.
 *
 * @param params - userId, type (tipo de notificación), title, message y opcionalmente link.
 * @returns La notificación creada (read: false, date: ahora).
 * @throws httpError 400 si title o message están vacíos.
 *
 * @example
 * createNotification({ userId: 'host-1', type: 'booking_confirmed', title: 'Nueva reserva', message: '...', link: '/host/dashboard' })
 */
export function createNotification(params: {
  userId: string
  type: NotificationType | string
  title: string
  message: string
  link?: string
}): Notification {
  const title = String(params.title || '').trim()
  const message = String(params.message || '').trim()
  if (!title) throw httpError(400, 'VALIDATION_ERROR', 'title is required')
  if (!message) throw httpError(400, 'VALIDATION_ERROR', 'message is required')

  return memoryCreateNotification({
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
 *
 * @param userId - Id del usuario.
 * @param notificationId - Id de la notificación.
 * @returns La notificación actualizada.
 * @throws httpError 404 si no existe la notificación o no pertenece al usuario.
 */
export function markAsRead(userId: string, notificationId: string) {
  const updated = memoryMarkAsRead(userId, notificationId)
  if (!updated) throw httpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found')
  return updated
}

/**
 * Marca todas las notificaciones del usuario como leídas.
 *
 * @param userId - Id del usuario.
 * @returns { ok: true, count: number } con el número de notificaciones actualizadas.
 */
export function markAllAsRead(userId: string) {
  const count = memoryMarkAllAsRead(userId)
  return { ok: true, count }
}

