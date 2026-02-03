import {
  memoryListProperties,
  memoryGetPropertyById,
  memoryListPropertiesByHost,
  memoryCreateProperty,
  memoryUpdateProperty,
  memoryDeleteProperty,
  memoryResetForDev,
} from '../../store/memoryProperties'
import type { IPropertyRepository } from '../types'

export function createMemoryPropertyRepository(): IPropertyRepository {
  return {
    async list() {
      return memoryListProperties()
    },
    async getById(id: string) {
      return memoryGetPropertyById(id)
    },
    async listByHost(hostId: string) {
      return memoryListPropertiesByHost(hostId)
    },
    async create(params) {
      return memoryCreateProperty(params)
    },
    async update(id: string, patch) {
      return memoryUpdateProperty(id, patch)
    },
    async delete(id: string) {
      return memoryDeleteProperty(id)
    },
  }
}

export function getMemoryPropertyReset(): { resetForDev(): void } {
  return { resetForDev: memoryResetForDev }
}
