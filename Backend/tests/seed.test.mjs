import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnServer, dropTestDb, request } from './helpers/server.mjs'
import { seedShop } from './fixtures/seed.mjs'

let server
let baseUrl
let seeded

before(async () => {
  server = await spawnServer()
  baseUrl = server.baseUrl
  seeded = await seedShop(baseUrl)
})

after(async () => {
  server.stop()
  await new Promise((resolve) => setTimeout(resolve, 500))
  await dropTestDb(server.dbName)
})

test('seeded shop has 3 customers', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/customers?limit=50', {
    token: seeded.token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.pagination.total, 3)
  const names = r.json.data.customers.map((c) => c.name)
  assert.ok(names.includes('Ravi Kumar'))
  assert.ok(names.includes('Mohan Das'))
})

test('seeded shop has 5 products', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/products?limit=50', {
    token: seeded.token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.pagination.total, 5)
})

test('seeded shop has 10 bills with sequential numbers', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/bills?limit=50', {
    token: seeded.token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.pagination.total, 10)
  const numbers = r.json.data.bills.map((b) => b.billNumber)
  assert.deepEqual(
    numbers.slice().sort(),
    Array.from(
      { length: 10 },
      (_, i) => `BILL-${todayStamp()}-${String(i + 1).padStart(3, '0')}`
    )
  )
})

test('dashboard reflects seeded data', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/dashboard/summary', {
    token: seeded.token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.totalBills, 10)
  assert.ok(r.json.data.totalRevenue > 0)
  assert.equal(r.json.data.recentBills.length, 5)
})

test('customers carry purchase stats from seeded bills', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/customers?limit=50', {
    token: seeded.token,
  })
  const ravi = r.json.data.customers.find((c) => c.name === 'Ravi Kumar')
  assert.ok(ravi.totalPurchases >= 1)
  assert.ok(ravi.lastPurchase)
})

const todayStamp = () => {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
