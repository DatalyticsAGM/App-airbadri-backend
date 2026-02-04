import mongoose from 'mongoose'
import type { Booking, BookingStatus } from '../../store/memoryBookings'
import { Booking as BookingModel } from '../../models/Booking'
import type { IBookingRepository } from '../types'

type BookingDoc = {
  _id: { toString(): string }
  propertyId: { toString(): string }
  userId: { toString(): string }
  checkIn: string
  checkOut: string
  guests: number
  totalPrice: number
  status: string
  createdAt: Date
  updatedAt: Date
}

function toBooking(doc: BookingDoc): Booking {
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

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(String(id || ''))
}

export function createBookingRepository(): IBookingRepository {
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
      return toBooking(doc as BookingDoc)
    },

    async getById(id: string) {
      if (!isValidObjectId(id)) return null
      const doc = await BookingModel.findById(id).lean()
      if (!doc) return null
      return toBooking(doc as BookingDoc)
    },

    async listByUser(userId: string) {
      if (!isValidObjectId(userId)) return []
      const docs = await BookingModel.find({ userId }).lean().sort({ createdAt: -1 })
      return docs.map((d) => toBooking(d as BookingDoc))
    },

    async listByProperty(propertyId: string) {
      if (!isValidObjectId(propertyId)) return []
      const docs = await BookingModel.find({ propertyId }).lean().sort({ checkIn: 1 })
      return docs.map((d) => toBooking(d as BookingDoc))
    },

    async updateStatus(id: string, status: BookingStatus) {
      if (!isValidObjectId(id)) return null
      const doc = await BookingModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean()
      if (!doc) return null
      return toBooking(doc as BookingDoc)
    },

    async deleteByProperty(propertyId: string) {
      if (!isValidObjectId(propertyId)) return 0
      const result = await BookingModel.deleteMany({ propertyId })
      return result.deletedCount ?? 0
    },
  }
}
