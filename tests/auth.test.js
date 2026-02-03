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

describe('Auth', () => {
  it('POST /api/auth/signup returns 201 with user and accessToken', async () => {
    const app = createApp()
    const { server, port } = listen(app)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Test User',
          email: 'test-auth@example.com',
          password: '123456',
        }),
      })
      assert.strictEqual(res.status, 201)
      const body = await res.json()
      assert.ok(body.user)
      assert.ok(body.accessToken)
      assert.strictEqual(body.user.email, 'test-auth@example.com')
    } finally {
      server.close()
    }
  })

  it('POST /api/auth/login with valid credentials returns 200', async () => {
    const app = createApp()
    const { server, port } = listen(app)
    try {
      await fetch(`http://127.0.0.1:${port}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Login User',
          email: 'login@example.com',
          password: '123456',
        }),
      })
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'login@example.com', password: '123456' }),
      })
      assert.strictEqual(res.status, 200)
      const body = await res.json()
      assert.ok(body.user)
      assert.ok(body.accessToken)
    } finally {
      server.close()
    }
  })

  it('GET /api/auth/me without token returns 401', async () => {
    const app = createApp()
    const { server, port } = listen(app)
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/me`)
      assert.strictEqual(res.status, 401)
      const body = await res.json()
      assert.ok(body.error)
      assert.ok(body.error.code)
    } finally {
      server.close()
    }
  })

  it('GET /api/auth/me with valid token returns 200 and user', async () => {
    const app = createApp()
    const { server, port } = listen(app)
    try {
      const signupRes = await fetch(`http://127.0.0.1:${port}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Me User',
          email: 'me@example.com',
          password: '123456',
        }),
      })
      const { accessToken } = await signupRes.json()
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      assert.strictEqual(res.status, 200)
      const body = await res.json()
      assert.ok(body.user)
      assert.strictEqual(body.user.email, 'me@example.com')
    } finally {
      server.close()
    }
  })
})
