'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.JWT_SECRET = 'test-secret'
process.env.USE_MEMORY_ONLY = '1'

const { createApp } = require('../dist/app')
const http = require('http')

function listen(app) {
  const server = http.createServer(app)
  server.listen(0)
  return { server, port: server.address().port }
}

describe('Properties', () => {
  it('GET /api/properties returns 200 with items, page, limit, total', async () => {
    const app = createApp()
    const { server, port } = listen(app)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/properties`)
      assert.strictEqual(res.status, 200)
      const body = await res.json()
      assert.ok(Array.isArray(body.items))
      assert.strictEqual(typeof body.page, 'number')
      assert.strictEqual(typeof body.limit, 'number')
      assert.strictEqual(typeof body.total, 'number')
    } finally {
      server.close()
    }
  })

  it('GET /api/properties/:id with invalid id returns 404', async () => {
    const app = createApp()
    const { server, port } = listen(app)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/properties/no-existe-123`)
      assert.strictEqual(res.status, 404)
      const body = await res.json()
      assert.ok(body.error)
      assert.strictEqual(body.error.code, 'PROPERTY_NOT_FOUND')
    } finally {
      server.close()
    }
  })
})
