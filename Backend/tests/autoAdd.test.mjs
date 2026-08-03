import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnServer, dropTestDb, request } from './helpers/server.mjs'

let server
let baseUrl
let token

const saveBill = async (productName, quantity, price) =>
  request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [{ productName, quantity, unit: 'kg', price }],
      paymentMethod: 'cash',
    },
  })

const listProducts = async (search) => {
  const q = search
    ? `?search=${encodeURIComponent(search)}&limit=50`
    : '?limit=50'
  const r = await request(baseUrl, 'GET', `/api/v1/products${q}`, { token })
  assert.equal(r.status, 200)
  return r.json.data.products
}

before(async () => {
  server = await spawnServer({ env: { PRODUCT_AUTO_ADD_THRESHOLD: '3' } })
  baseUrl = server.baseUrl

  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Auto Add Test',
      shopName: 'Auto Shop',
      shopType: 'grocery',
      email: 'autoadd@test.com',
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

test('product auto-added after 4th sale with sales counts', async () => {
  for (let i = 0; i < 3; i++) {
    const r = await saveBill('AutoTea', 2, 120)
    assert.equal(r.status, 201)
  }
  assert.equal((await listProducts('AutoTea')).length, 0)

  await saveBill('AutoTea', 2, 120)

  const products = await listProducts('AutoTea')
  assert.equal(products.length, 1)
  const p = products[0]
  assert.equal(p.name, 'AutoTea')
  assert.equal(p.autoAdded, true)
  assert.equal(p.price, 60)
  assert.equal(p.unit, 'kg')
  assert.equal(p.monthlySold, 4)
  assert.equal(p.monthlyQuantity, 8)
})

test('case-insensitive sales count without duplicate product', async () => {
  await saveBill('autotea', 2, 120)

  const products = await listProducts('autotea')
  assert.equal(products.length, 1)
  assert.equal(products[0].monthlySold, 5)
})

test('low-selling items are never auto-added', async () => {
  for (let i = 0; i < 3; i++) {
    await saveBill('OneOff', 1, 50)
  }
  assert.equal((await listProducts('OneOff')).length, 0)
})

test('manual products show sales counts and never duplicate', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/products', {
    token,
    body: { name: 'Rice', price: 100, unit: 'kg' },
  })
  assert.equal(r.status, 201)

  for (let i = 0; i < 4; i++) {
    await saveBill('rice', 1, 100)
  }

  const products = await listProducts('rice')
  assert.equal(products.length, 1)
  assert.equal(products[0].name, 'Rice')
  assert.equal(products[0].autoAdded, false)
  assert.equal(products[0].monthlySold, 4)
})
