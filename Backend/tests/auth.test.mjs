import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnServer, dropTestDb, request } from './helpers/server.mjs'

let server
let baseUrl

before(async () => {
  server = await spawnServer()
  baseUrl = server.baseUrl
})

after(async () => {
  server.stop()
  await new Promise((resolve) => setTimeout(resolve, 500))
  await dropTestDb(server.dbName)
})

const EMAIL = 'auth@test.com'
const PASSWORD = 'secret123'
let refreshCookie = ''
let accessToken = ''

test('register creates a user and returns an access token', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Auth Test',
      shopName: 'Auth Shop',
      shopType: 'grocery',
      email: EMAIL,
      password: PASSWORD,
    },
  })
  assert.equal(r.status, 201)
  assert.ok(r.json.data.accessToken)
  assert.ok(r.json.data.user.email, EMAIL)
})

test('register rejects duplicate email with 409', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Auth Test',
      shopName: 'Auth Shop',
      shopType: 'grocery',
      email: EMAIL,
      password: PASSWORD,
    },
  })
  assert.equal(r.status, 409)
})

test('register rejects invalid input with 400', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'X',
      shopName: '',
      shopType: 'grocery',
      email: 'not-an-email',
      password: 'short',
    },
  })
  assert.equal(r.status, 400)
})

test('login returns token and sets refresh cookie with Path=/', async () => {
  const res = await fetch(baseUrl + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(30000),
  })
  const json = await res.json()
  const setCookie = res.headers.get('set-cookie') || ''
  assert.equal(res.status, 200)
  assert.ok(json.data.accessToken)
  assert.match(setCookie, /refreshToken=/)
  assert.match(setCookie, /HttpOnly/i)
  assert.match(setCookie, /Path=\//)
  refreshCookie = setCookie.split(';')[0]
})

test('login rejects wrong password with 401', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/auth/login', {
    body: { email: EMAIL, password: 'wrongpass' },
  })
  assert.equal(r.status, 401)
})

test('refresh endpoint rotates the token', async () => {
  const res = await fetch(baseUrl + '/api/v1/auth/refresh', {
    method: 'POST',
    headers: { Cookie: refreshCookie },
    signal: AbortSignal.timeout(30000),
  })
  const json = await res.json()
  assert.equal(res.status, 200)
  assert.ok(json.data.accessToken)
  accessToken = json.data.accessToken
  refreshCookie = (res.headers.get('set-cookie') || '').split(';')[0]
})

test('access token works on protected routes', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/customers', {
    token: accessToken,
  })
  assert.equal(r.status, 200)
})

test('logout revokes the refresh token', async () => {
  const res = await fetch(baseUrl + '/api/v1/auth/logout', {
    method: 'POST',
    headers: { Cookie: refreshCookie },
    signal: AbortSignal.timeout(30000),
  })
  assert.equal(res.status, 200)

  const afterLogout = await fetch(baseUrl + '/api/v1/auth/refresh', {
    method: 'POST',
    headers: { Cookie: refreshCookie },
    signal: AbortSignal.timeout(30000),
  })
  assert.equal(afterLogout.status, 401)
})

test('profile update with new name via PUT', async () => {
  const r = await request(baseUrl, 'PUT', '/api/v1/auth/profile', {
    token: accessToken,
    body: { ownerName: 'Updated Name' },
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.user.ownerName, 'Updated Name')
})

test('profile requires at least one field', async () => {
  const r = await request(baseUrl, 'PUT', '/api/v1/auth/profile', {
    token: accessToken,
    body: {},
  })
  assert.equal(r.status, 400)
})
