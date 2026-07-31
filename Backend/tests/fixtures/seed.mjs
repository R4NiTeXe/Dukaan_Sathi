import { request } from '../helpers/server.mjs'

const CUSTOMERS = [
  { name: 'Ravi Kumar', phone: '9800000001' },
  { name: 'Sita Devi', phone: '9800000002' },
  { name: 'Mohan Das', phone: '9800000003' },
]

const PRODUCTS = [
  { name: 'Rice', price: 100, unit: 'kg', category: 'grains' },
  { name: 'Sugar', price: 50, unit: 'kg', category: 'groceries' },
  { name: 'Tea', price: 30, unit: 'pack', category: 'beverages' },
  { name: 'Milk', price: 60, unit: 'liter', category: 'dairy' },
  { name: 'Salt', price: 20, unit: 'pack', category: 'groceries' },
]

const ITEMS = [
  [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }],
  [{ productName: 'Sugar', quantity: 1, unit: 'kg', price: 50 }],
  [{ productName: 'Tea', quantity: 1, unit: 'pack', price: 30 }],
]

export const seedShop = async (
  baseUrl,
  { email = 'seed@test.com', bills = 10 } = {}
) => {
  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Seed Owner',
      shopName: 'Seed Shop',
      shopType: 'grocery',
      email,
      password: 'secret123',
    },
  })
  const token = reg.json.data.accessToken

  const customerIds = []
  for (const c of CUSTOMERS) {
    const r = await request(baseUrl, 'POST', '/api/v1/customers', {
      token,
      body: c,
    })
    customerIds.push(r.json.data.customer._id)
  }

  const productIds = []
  for (const p of PRODUCTS) {
    const r = await request(baseUrl, 'POST', '/api/v1/products', {
      token,
      body: p,
    })
    productIds.push(r.json.data.product._id)
  }

  const billIds = []
  for (let i = 0; i < bills; i++) {
    const items = ITEMS[i % ITEMS.length]
    const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
      token,
      body: {
        items,
        paymentMethod: i % 2 === 0 ? 'cash' : 'upi',
        customerId: i % 2 === 0 ? customerIds[i % customerIds.length] : null,
      },
    })
    billIds.push(r.json.data.bill._id)
  }

  return {
    token,
    customerIds,
    productIds,
    billIds,
    customers: CUSTOMERS,
    products: PRODUCTS,
  }
}
