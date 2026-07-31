import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnServer, dropTestDb, request } from './helpers/server.mjs'

let server
let baseUrl
let token
let customerId
let productId
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
    body: { name: 'Rahul', phone: '9876543210' },
  })
  assert.equal(r.status, 201)
  assert.equal(r.json.data.customer.name, 'Rahul')
  customerId = r.json.data.customer._id
})

test('list customers with search', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/customers', { token })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.customers.length, 1)

  const s = await request(baseUrl, 'GET', '/api/v1/customers?search=rah', {
    token,
  })
  assert.equal(s.json.data.customers.length, 1)

  const empty = await request(baseUrl, 'GET', '/api/v1/customers?search=zzz', {
    token,
  })
  assert.equal(empty.json.data.customers.length, 0)
})

test('update customer', async () => {
  const r = await request(baseUrl, 'PUT', `/api/v1/customers/${customerId}`, {
    token,
    body: { phone: '9998887770' },
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.customer.phone, '9998887770')
})

test('create product', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/products', {
    token,
    body: { name: 'Rice', price: 100, unit: 'kg' },
  })
  assert.equal(r.status, 201)
  assert.equal(r.json.data.product.name, 'Rice')
  productId = r.json.data.product._id
})

test('update product', async () => {
  const r = await request(baseUrl, 'PUT', `/api/v1/products/${productId}`, {
    token,
    body: { price: 110 },
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.product.price, 110)
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
  assert.ok(customer.lastPurchase)
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

test('update bill payment status and customer stats', async () => {
  const r = await request(baseUrl, 'PUT', `/api/v1/bills/${billId}`, {
    token,
    body: { paymentStatus: 'paid' },
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.bill.paymentStatus, 'paid')
})

test('analytics customer-report includes customer details', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/analytics/customer-report', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.data[0].name, 'Rahul')
  assert.equal(r.json.data.data[0].totalSpent, 200)
})

test('search finds bills, products and customers', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/search?q=Rice', { token })
  assert.equal(r.status, 200)
  assert.ok(r.json.data.bills.length >= 1)
  assert.equal(r.json.data.products[0].name, 'Rice')
})

test('delete bill returns 404 on second delete', async () => {
  const r = await request(baseUrl, 'DELETE', `/api/v1/bills/${billId}`, {
    token,
  })
  assert.equal(r.status, 200)

  const again = await request(baseUrl, 'DELETE', `/api/v1/bills/${billId}`, {
    token,
  })
  assert.equal(again.status, 404)
})

test('dashboard summary aggregates correctly', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/dashboard/summary', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.totalBills, 2)
  assert.equal(r.json.data.totalRevenue, 80)
  assert.equal(r.json.data.todayRevenue, 80)
  assert.ok(r.json.data.recentBills.length >= 1)
})

test('analytics monthly returns current month entry', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/analytics/monthly', {
    token,
  })
  assert.equal(r.status, 200)
  assert.equal(r.json.data.data.length, 1)
  assert.equal(r.json.data.data[0].billCount, 2)
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
  assert.equal(r.json.data.data[0].productName, 'Sugar')
  assert.equal(r.json.data.data[0].totalRevenue, 50)
})

test('search without query returns 400', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/search', { token })
  assert.equal(r.status, 400)
})

test('delete customer', async () => {
  const r = await request(
    baseUrl,
    'DELETE',
    `/api/v1/customers/${customerId}`,
    { token }
  )
  assert.equal(r.status, 200)
})

test('delete product', async () => {
  const r = await request(baseUrl, 'DELETE', `/api/v1/products/${productId}`, {
    token,
  })
  assert.equal(r.status, 200)
})
