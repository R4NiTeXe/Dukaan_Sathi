import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnServer, dropTestDb, request } from './helpers/server.mjs'

let server
let baseUrl
let token

before(async () => {
  server = await spawnServer({ rateLimitMax: 20 })
  baseUrl = server.baseUrl

  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Edge Test',
      shopName: 'Edge Shop',
      shopType: 'grocery',
      email: 'edge@test.com',
      password: 'secret123',
    },
  })
  token = reg.json.data.accessToken
})

after(async () => {
  server.stop()
  await new Promise((resolve) => setTimeout(resolve, 500))
  await dropTestDb(server.dbName)
})

test('empty DB analytics return empty arrays, not errors', async () => {
  const monthly = await request(baseUrl, 'GET', '/api/v1/analytics/monthly', {
    token,
  })
  assert.equal(monthly.status, 200)
  assert.deepEqual(monthly.json.data.data, [])

  const top = await request(baseUrl, 'GET', '/api/v1/analytics/top-products', {
    token,
  })
  assert.equal(top.status, 200)
  assert.deepEqual(top.json.data.data, [])

  const customers = await request(
    baseUrl,
    'GET',
    '/api/v1/analytics/customer-report',
    { token }
  )
  assert.equal(customers.status, 200)
  assert.deepEqual(customers.json.data.data, [])
})

test('invalid ObjectId returns 400', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/bills/not-an-id', { token })
  assert.equal(r.status, 400)
})

test('non-existent bill returns 404', async () => {
  const r = await request(
    baseUrl,
    'GET',
    '/api/v1/bills/507f1f77bcf86cd799439011',
    { token }
  )
  assert.equal(r.status, 404)
})

test('Zod validation failure returns 400', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: { items: [], paymentMethod: 'bitcoin' },
  })
  assert.equal(r.status, 400)
})

test('request without token returns 401', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/customers')
  assert.equal(r.status, 401)
})

test('error responses never leak stack traces', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: { items: [], paymentMethod: 'bitcoin' },
  })
  assert.equal(r.json.stack, undefined)
  assert.equal(r.json.success, false)
})

test('oversized request body returns 413', async () => {
  const big = {
    items: [
      {
        productName: 'X'.repeat(1.2 * 1024 * 1024),
        quantity: 1,
        unit: 'piece',
        price: 10,
      },
    ],
    paymentMethod: 'cash',
  }
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: big,
  })
  assert.equal(r.status, 413)
})

test('concurrent bill saves produce unique sequential numbers', async () => {
  const bodies = Array.from({ length: 10 }, (_, i) => ({
    items: [
      { productName: `Item ${i}`, quantity: 1, unit: 'piece', price: 10 },
    ],
    paymentMethod: 'cash',
  }))
  const results = await Promise.all(
    bodies.map((body) =>
      request(baseUrl, 'POST', '/api/v1/billing/save', { token, body })
    )
  )
  results.forEach((r) => assert.equal(r.status, 201))

  const numbers = results.map((r) => r.json.data.bill.billNumber)
  assert.equal(
    new Set(numbers).size,
    10,
    `numbers must be unique, got: ${numbers}`
  )
  assert.deepEqual(
    numbers.sort(),
    Array.from(
      { length: 10 },
      (_, i) => `BILL-${todayStamp()}-${String(i + 1).padStart(3, '0')}`
    )
  )
})

const todayStamp = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

test('rate limiter blocks requests beyond limit with 429', async () => {
  let lastStatus = 0
  for (let i = 0; i < 25; i++) {
    const r = await request(baseUrl, 'GET', '/api/v1/customers', { token })
    lastStatus = r.status
  }
  assert.equal(lastStatus, 429)
})
