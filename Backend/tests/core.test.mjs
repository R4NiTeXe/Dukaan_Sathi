import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnServer, dropTestDb, request } from './helpers/server.mjs'

let server
let baseUrl
let token
let customerId
let billId

before(async () => {
  server = await spawnServer()
  baseUrl = server.baseUrl

  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Core Test',
      shopName: 'Core Shop',
      shopType: 'grocery',
      email: 'core@test.com',
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

test('create customer', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/customers', {
    token,
    body: {},
  })
  assert.equal(r.status, 201)
  assert.match(r.json.data.customer.customerNumber, /^CUST-[0-9a-f]{24}-\d{3}$/)
  customerId = r.json.data.customer._id
})

test('list customers with search', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/customers', { token })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.customers.length, 1)
  assert.ok(r.json.data.customers[0].customerNumber.startsWith('CUST-'))

  const s = await request(baseUrl, 'GET', '/api/v1/customers?search=001', {
    token,
  })
  assert.equal(s.json.data.customers.length, 1)

  const empty = await request(baseUrl, 'GET', '/api/v1/customers?search=zzz', {
    token,
  })
  assert.equal(empty.json.data.customers.length, 0)
})

test('create product', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/products', {
    token,
    body: { name: 'Rice', price: 100, unit: 'kg' },
  })
  assert.equal(r.status, 201)
  assert.equal(r.json.data.product.name, 'Rice')
})

test('save bill updates customer stats', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }],
      paymentMethod: 'cash',
      customerId,
    },
  })
  assert.equal(r.status, 201)
  assert.equal(r.json.data.bill.totalAmount, 200)
  assert.match(r.json.data.bill.billNumber, /^BILL-\d{8}-\d{3}$/)
  billId = r.json.data.bill._id

  const c = await request(baseUrl, 'GET', '/api/v1/customers', { token })
  const customer = c.json.data.customers.find((x) => x._id === customerId)
  assert.equal(customer.totalPurchases, 1)
})

test('bill numbers increment sequentially', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [{ productName: 'Sugar', quantity: 1, unit: 'kg', price: 50 }],
      paymentMethod: 'cash',
    },
  })
  assert.equal(r.status, 201)
  assert.match(r.json.data.bill.billNumber, /^BILL-\d{8}-002$/)
})

test('save bill without customer keeps customerId null', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [{ productName: 'Tea', quantity: 1, unit: 'pack', price: 30 }],
      paymentMethod: 'upi',
    },
  })
  assert.equal(r.status, 201)
  assert.equal(r.json.data.bill.customerId, null)
})

test('list bills with pagination and filters', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/bills?limit=2&page=1', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.bills.length, 2)
  assert.equal(r.json.data.pagination.total, 3)
  assert.equal(r.json.data.pagination.totalPages, 2)

  const paid = await request(
    baseUrl,
    'GET',
    '/api/v1/bills?paymentStatus=unpaid',
    { token }
  )
  assert.equal(paid.json.data.pagination.total, 0)

  const cash = await request(
    baseUrl,
    'GET',
    '/api/v1/bills?paymentMethod=cash',
    { token }
  )
  assert.equal(cash.json.data.pagination.total, 2)
})

test('get single bill', async () => {
  const r = await request(baseUrl, 'GET', `/api/v1/bills/${billId}`, { token })
  assert.equal(r.status, 200)
  assert.match(r.json.data.bill.billNumber, /^BILL-\d{8}-001$/)
})

test('analytics customer-report includes customer details', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/analytics/customer-report', {
    token,
  })
  assert.equal(r.status, 200)
  assert.match(r.json.data.data[0].customerNumber, /^CUST-/)
  assert.equal(r.json.data.data[0].totalSpent, 200)
})

test('dashboard summary aggregates correctly', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/dashboard/summary', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.totalBills, 3)
  assert.equal(r.json.data.totalRevenue, 280)
  assert.equal(r.json.data.todayRevenue, 280)
  assert.ok(r.json.data.recentBills.length >= 1)
})

test('analytics monthly returns current month entry', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/analytics/monthly', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.data.length, 1)
  assert.equal(r.json.data.data[0].billCount, 3)
})

test('analytics weekly returns today entry', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/analytics/weekly', { token })
  assert.equal(r.status, 200)
  assert.ok(r.json.data.data.length >= 1)
})

test('analytics top-products ranks by revenue', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/analytics/top-products', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.data[0].productName, 'Rice')
  assert.equal(r.json.data.data[0].totalRevenue, 200)
  assert.equal(r.json.data.data[1].productName, 'Sugar')
  assert.equal(r.json.data.data[1].totalRevenue, 50)
})
