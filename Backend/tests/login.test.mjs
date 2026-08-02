import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  spawnServer,
  dropTestDb,
  request,
  registerUser,
} from './helpers/server.mjs'
import 'dotenv/config'

let server
let baseUrl

const login = (email, password) =>
  request(baseUrl, 'POST', '/api/v1/auth/login', {
    body: { email, password },
  })

before(async () => {
  server = await spawnServer({
    env: {
      LOGIN_MAX_FAILURES: '3',
      LOGIN_WINDOW_MS: '5000',
    },
  })
  baseUrl = server.baseUrl
  await registerUser(baseUrl, 'throttle@test.com')
})

after(async () => {
  server.stop()
  await new Promise((resolve) => setTimeout(resolve, 500))
  await dropTestDb(server.dbName)
})

test('locks out after repeated failed logins and lifts after the window', async () => {
  for (let i = 1; i <= 3; i++) {
    const r = await login('throttle@test.com', 'wrongpass')
    assert.equal(r.status, 401)
  }

  const blocked = await login('throttle@test.com', 'secret123')
  assert.equal(blocked.status, 429)
  assert.match(blocked.json.message, /too many failed login attempts/i)

  const stillBlocked = await login('throttle@test.com', 'secret123')
  assert.equal(stillBlocked.status, 429)

  await new Promise((resolve) => setTimeout(resolve, 5200))

  const afterWait = await login('throttle@test.com', 'secret123')
  assert.equal(afterWait.status, 200)
})

test('successful login resets the attempt counter', async () => {
  assert.equal((await login('throttle@test.com', 'wrongpass')).status, 401)
  assert.equal((await login('throttle@test.com', 'wrongpass')).status, 401)
  assert.equal((await login('throttle@test.com', 'secret123')).status, 200)
  assert.equal((await login('throttle@test.com', 'wrongpass')).status, 401)
  assert.equal((await login('throttle@test.com', 'wrongpass')).status, 401)
  assert.equal((await login('throttle@test.com', 'secret123')).status, 200)
})

test('lockout is scoped per email', async () => {
  await registerUser(baseUrl, 'other@test.com')

  for (let i = 1; i <= 3; i++) {
    assert.equal((await login('other@test.com', 'wrongpass')).status, 401)
  }
  assert.equal((await login('other@test.com', 'secret123')).status, 429)
  assert.equal((await login('throttle@test.com', 'secret123')).status, 200)
})
