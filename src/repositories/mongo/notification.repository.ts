import type { Notification } from '../../store/memoryNotifications'
import { Notification as NotificationModel } from '../../models/Notification'

function toNotification(doc: { _id: { toString(): string }; userId: { toString(): string }; type: string; title: string; message: string; read: boolean; date: string; link?: string; createdAt: Date; updatedAt: Date }): Notification {
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

export function createNotificationRepository(): import('../types').INotificationRepository {
  return {
    async getByUser(userId: string) {
      const docs = await NotificationModel.find({ userId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toNotification(d as Parameters<typeof toNotification>[0]))
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
      return toNotification(doc as unknown as Parameters<typeof toNotification>[0])
    },

    async markAsRead(userId: string, id: string) {
      const doc = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { $set: { read: true } }, { new: true }).lean()
      if (!doc) return null
      return toNotification(doc as Parameters<typeof toNotification>[0])
    },

    async markAllAsRead(userId: string) {
      const result = await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } })
      return result.modifiedCount ?? 0
    },

    async getUnreadCount(userId: string) {
      return NotificationModel.countDocuments({ userId, read: false })
    },
  }
}
