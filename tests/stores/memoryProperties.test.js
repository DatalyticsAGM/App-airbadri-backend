'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.JWT_SECRET = 'test-secret'
process.env.USE_MEMORY_ONLY = '1'

const {
  memoryListProperties,
  memoryGetPropertyById,
  memoryCreateProperty,
  memoryUpdateProperty,
  memoryDeleteProperty,
} = require('../../dist/store/memoryProperties')

describe('memoryProperties store', () => {
  it('memoryListProperties returns array', () => {
    const list = memoryListProperties()
    assert.ok(Array.isArray(list))
  })

  it('memoryGetPropertyById with non-existent id returns undefined or null', () => {
    const p = memoryGetPropertyById('non-existent-id-xyz')
    assert.strictEqual(p, null)
  })

  it('memoryCreateProperty then memoryGetPropertyById returns the property', () => {
    const created = memoryCreateProperty({
      hostId: 'test-host',
      title: 'Test',
      description: 'Desc',
      location: 'City',
      pricePerNight: 100,
      images: [],
      amenities: [],
    })
    assert.ok(created.id)
    const found = memoryGetPropertyById(created.id)
    assert.strictEqual(found?.title, 'Test')
    assert.strictEqual(found?.pricePerNight, 100)
    memoryDeleteProperty(created.id)
  })
})
