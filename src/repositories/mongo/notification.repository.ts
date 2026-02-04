import mongoose from 'mongoose'
import type { Notification } from '../../store/memoryNotifications'
import { Notification as NotificationModel } from '../../models/Notification'
import type { INotificationRepository } from '../types'

type NotificationDoc = {
  _id: { toString(): string }
  userId: { toString(): string }
  type: string
  title: string
  message: string
  read: boolean
  date: string
  link?: string
  createdAt: Date
  updatedAt: Date
}

function toNotification(doc: NotificationDoc): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    read: doc.read,
    date: doc.date,
    link: doc.link,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(String(id || ''))
}

export function createNotificationRepository(): INotificationRepository {
  return {
    async getByUser(userId: string) {
      if (!isValidObjectId(userId)) return []
      const docs = await NotificationModel.find({ userId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toNotification(d as NotificationDoc))
    },

    async create(params) {
      const doc = await NotificationModel.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        read: params.read ?? false,
        date: params.date,
        link: params.link,
      })
      return toNotification(doc as NotificationDoc)
    },

    async markAsRead(userId: string, id: string) {
      // Evita CastError cuando llega ':id' o un id inválido desde Postman.
      if (!isValidObjectId(userId) || !isValidObjectId(id)) return null
      const doc = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true }).lean()
      if (!doc) return null
      return toNotification(doc as NotificationDoc)
    },

    async markAllAsRead(userId: string) {
      if (!isValidObjectId(userId)) return 0
      const result = await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } })
      return result.modifiedCount ?? 0
    },

    async getUnreadCount(userId: string) {
      if (!isValidObjectId(userId)) return 0
      return NotificationModel.countDocuments({ userId, read: false })
    },
  }
}
