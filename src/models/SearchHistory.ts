/**
 * Módulo SearchHistory (modelo).
 *
 * Persistencia del historial de búsquedas por usuario en MongoDB.
 * Se usa por repositories/mongo/searchHistory.repository cuando la API corre con MongoDB.
 */
import mongoose, { Schema } from 'mongoose'

type SearchHistoryEntryDoc = {
  query?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  checkIn?: string
  checkOut?: string
  date: string
}

type SearchHistoryDoc = {
  _id: mongoose.Types.ObjectId
  userId: string
  entries: SearchHistoryEntryDoc[]
  createdAt: Date
  updatedAt: Date
}

const entrySchema = new Schema<SearchHistoryEntryDoc>(
  {
    query: { type: String, required: false, trim: true },
    location: { type: String, required: false, trim: true },
    minPrice: { type: Number, required: false },
    maxPrice: { type: Number, required: false },
    checkIn: { type: String, required: false, trim: true },
    checkOut: { type: String, required: false, trim: true },
    date: { type: String, required: true },
  },
  { _id: false }
)

const searchHistorySchema = new Schema<SearchHistoryDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    entries: { type: [entrySchema], required: true, default: [] },
  },
  { timestamps: true }
)

/**
 * Modelo de Mongoose para la colección de historial de búsquedas por usuario.
 */
export const SearchHistory = mongoose.model<SearchHistoryDoc>('SearchHistory', searchHistorySchema)

