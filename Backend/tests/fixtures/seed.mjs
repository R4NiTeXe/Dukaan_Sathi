import { request } from '../helpers/server.mjs';

const PRODUCTS = [
  { name: 'Rice', price: 100, unit: 'kg' },
  { name: 'Sugar', price: 50, unit: 'kg' },
  { name: 'Tea', price: 30, unit: 'pack' },
  { name: 'Milk', price: 60, unit: 'liter' },
  { name: 'Salt', price: 20, unit: 'pack' },
];

const ITEMS = [
  [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }],
  [{ productName: 'Sugar', quantity: 1, unit: 'kg', price: 50 }],
  [{ productName: 'Tea', quantity: 1, unit: 'pack', price: 30 }],
];

export const seedShop = async (
  baseUrl,
  { email = 'seed@test.com', bills = 10, customers = 3 } = {}
) => {
  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Seed Owner',
      shopName: 'Seed Shop',
      shopType: 'grocery',
      email,
      password: 'secret123',
    },
  });
  const token = reg.json.data.accessToken;

  const customerIds = [];
  const customerNumbers = [];
  for (let i = 0; i < customers; i++) {
    const r = await request(baseUrl, 'POST', '/api/v1/customers', {
      token,
      body: {},
    });
    customerIds.push(r.json.data.customer._id);
    customerNumbers.push(r.json.data.customer.customerNumber);
  }

  const productIds = [];
  for (const p of PRODUCTS) {
    const r = await request(baseUrl, 'POST', '/api/v1/products', {
      token,
      body: p,
    });
    productIds.push(r.json.data.product._id);
  }

  const billIds = [];
  for (let i = 0; i < bills; i++) {
    const items = ITEMS[i % ITEMS.length];
    const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
      token,
      body: {
        items,
        paymentMethod: i % 2 === 0 ? 'cash' : 'upi',
        customerId: i % 2 === 0 ? customerIds[i % customerIds.length] : null,
      },
    });
    billIds.push(r.json.data.bill._id);
  }

  return {
    token,
    customerIds,
    customerNumbers,
    productIds,
    billIds,
    products: PRODUCTS,
  };
};
