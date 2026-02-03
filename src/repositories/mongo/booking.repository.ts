import type { Booking, BookingStatus } from '../../store/memoryBookings'
import { Booking as BookingModel } from '../../models/Booking'

function toBooking(doc: { _id: { toString(): string }; propertyId: { toString(): string }; userId: { toString(): string }; checkIn: string; checkOut: string; guests: number; totalPrice: number; status: string; createdAt: Date; updatedAt: Date }): Booking {
  return {
    id: doc._id.toString(),
    propertyId: doc.propertyId.toString(),
    userId: doc.userId.toString(),
    checkIn: doc.checkIn,
    checkOut: doc.checkOut,
    guests: doc.guests,
    totalPrice: doc.totalPrice,
    status: doc.status as BookingStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export function createBookingRepository(): import('../types').IBookingRepository {
  return {
    async create(params) {
      const doc = await BookingModel.create({
        propertyId: params.propertyId,
        userId: params.userId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
        totalPrice: params.totalPrice,
        status: params.status,
      })
      return toBooking(doc as unknown as Parameters<typeof toBooking>[0])
    },

    async getById(id: string) {
      const doc = await BookingModel.findById(id).lean()
      if (!doc) return null
      return toBooking(doc as Parameters<typeof toBooking>[0])
    },

    async listByUser(userId: string) {
      const docs = await BookingModel.find({ userId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toBooking(d as Parameters<typeof toBooking>[0]))
    },

    async listByProperty(propertyId: string) {
      const docs = await BookingModel.find({ propertyId }).lean().sort({ checkIn: 1 })
      return docs.map((d) => toBooking(d as Parameters<typeof toBooking>[0]))
    },

    async updateStatus(id: string, status: BookingStatus) {
      const doc = await BookingModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean()
      if (!doc) return null
      return toBooking(doc as Parameters<typeof toBooking>[0])
    },

    async deleteByProperty(propertyId: string) {
      const result = await BookingModel.deleteMany({ propertyId })
      return result.deletedCount ?? 0
    },
  }
}
