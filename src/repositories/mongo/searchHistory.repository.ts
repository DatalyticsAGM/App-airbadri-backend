import { SearchHistory } from '../../models/SearchHistory'
import type { SearchHistoryEntry } from '../../store/memorySearchHistory'
import type { ISearchHistoryRepository } from '../types'

const MAX_ENTRIES_PER_USER = 20

function dedupeAndPrepend(
  list: SearchHistoryEntry[],
  next: Omit<SearchHistoryEntry, 'date'>
): SearchHistoryEntry[] {
  const newEntry: SearchHistoryEntry = { ...next, date: new Date().toISOString() }
  const filtered = list.filter(
    (e) =>
      e.query !== newEntry.query ||
      e.location !== newEntry.location ||
      e.checkIn !== newEntry.checkIn ||
      e.checkOut !== newEntry.checkOut
  )
  filtered.unshift(newEntry)
  return filtered.slice(0, MAX_ENTRIES_PER_USER)
}

export function createSearchHistoryRepository(): ISearchHistoryRepository {
  return {
    async get(userId: string) {
      const doc = await SearchHistory.findOne({ userId }).lean()
      return (doc?.entries || []) as SearchHistoryEntry[]
    },

    async add(userId: string, entry) {
      const doc = await SearchHistory.findOne({ userId })
      if (!doc) {
        const entries = dedupeAndPrepend([], entry)
        await SearchHistory.create({ userId, entries })
        return entries
      }

      const current = (doc.entries || []) as SearchHistoryEntry[]
      const next = dedupeAndPrepend(current, entry)
      doc.entries = next
      await doc.save()
      return next
    },

    async clear(userId: string) {
      await SearchHistory.updateOne({ userId }, { $set: { entries: [] } }, { upsert: true })
    },
  }
}

