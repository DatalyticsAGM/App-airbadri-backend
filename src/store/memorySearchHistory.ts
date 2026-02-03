const MAX_ENTRIES_PER_USER = 20

export type SearchHistoryEntry = {
  query?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  checkIn?: string
  checkOut?: string
  date: string
}

const historyByUser = new Map<string, SearchHistoryEntry[]>()

export function memoryGetSearchHistory(userId: string): SearchHistoryEntry[] {
  return historyByUser.get(userId) || []
}

export function memoryAddSearchHistory(userId: string, entry: Omit<SearchHistoryEntry, 'date'>) {
  const list = historyByUser.get(userId) || []
  const newEntry: SearchHistoryEntry = { ...entry, date: new Date().toISOString() }
  const filtered = list.filter(
    (e) =>
      e.query !== newEntry.query ||
      e.location !== newEntry.location ||
      e.checkIn !== newEntry.checkIn ||
      e.checkOut !== newEntry.checkOut
  )
  filtered.unshift(newEntry)
  const trimmed = filtered.slice(0, MAX_ENTRIES_PER_USER)
  historyByUser.set(userId, trimmed)
  return trimmed
}

export function memoryClearSearchHistory(userId: string) {
  historyByUser.set(userId, [])
}

/** Solo para uso en seed de desarrollo. Vacía todo el historial de búsquedas. */
export function memoryResetForDev() {
  historyByUser.clear()
}
