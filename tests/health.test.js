'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert')

process.env.JWT_SECRET = 'test-secret'
process.env.USE_MEMORY_ONLY = '1'

const { createApp } = require('../dist/app')
const http = require('http')

describe('Health and ready', () => {
  it('GET /health returns 200 and { ok: true }', async () => {
    const app = createApp()
    const server = http.createServer(app)
    server.listen(0)
    const port = server.address().port
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`)
      assert.strictEqual(res.status, 200)
      const body = await res.json()
      assert.strictEqual(body.ok, true)
    } finally {
      server.close()
    }
  })

  it('GET /ready returns 200 and ready: true', async () => {
    const app = createApp()
    const server = http.createServer(app)
    server.listen(0)
    const port = server.address().port
    try {
      const res = await fetch(`http://127.0.0.1:${port}/ready`)
      assert.strictEqual(res.status, 200)
      const body = await res.json()
      assert.strictEqual(body.ok, true)
      assert.strictEqual(body.ready, true)
    } finally {
      server.close()
    }
  })
})
