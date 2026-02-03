import {
  memoryGetSearchHistory,
  memoryAddSearchHistory,
  memoryClearSearchHistory,
  memoryResetForDev,
} from '../../store/memorySearchHistory'
import type { ISearchHistoryRepository } from '../types'

export function createMemorySearchHistoryRepository(): ISearchHistoryRepository {
  return {
    async get(userId: string) {
      return memoryGetSearchHistory(userId)
    },
    async add(userId: string, entry) {
      return memoryAddSearchHistory(userId, entry)
    },
    async clear(userId: string) {
      memoryClearSearchHistory(userId)
    },
  }
}

export function getMemorySearchHistoryReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
