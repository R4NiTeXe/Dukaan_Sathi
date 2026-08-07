import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnServer, dropTestDb, request, registerUser } from './helpers/server.mjs';

let server;
let baseUrl;
let token;

before(async () => {
  server = await spawnServer();
  baseUrl = server.baseUrl;

  const reg = await registerUser(baseUrl, 'recent@test.com');
  token = reg.json.data.accessToken;
});

after(async () => {
  server.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await dropTestDb(server.dbName);
});

test('recent-products is empty before any bill', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/billing/recent-products', { token });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.data.products, []);
});

test('recent-products returns most recent billing per product', async () => {
  // First bill: Rice 2kg @ total 200 (unit price 100), Sugar 1kg @ 40
  await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [
        { productName: 'Rice', quantity: 2, unit: 'kg', price: 200 },
        { productName: 'Sugar', quantity: 1, unit: 'kg', price: 40 },
      ],
      paymentMethod: 'cash',
    },
  });

  // Second bill: Sugar again with a new price + a fresh product
  await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [
        { productName: 'Sugar', quantity: 2, unit: 'kg', price: 100, pricePerUnit: true },
        { productName: 'Tea', quantity: 1, unit: 'pack', price: 30 },
      ],
      paymentMethod: 'upi',
    },
  });

  const r = await request(baseUrl, 'GET', '/api/v1/billing/recent-products', { token });
  assert.equal(r.status, 200);

  const products = r.json.data.products;
  assert.equal(products.length, 3);

  // Sorted by most recently billed first (Rice was billed earliest).
  const names = products.map((p) => p.productName);
  assert.equal(names[2], 'Rice');
  assert.ok(names.indexOf('Sugar') < names.indexOf('Rice'));
  assert.ok(names.indexOf('Tea') < names.indexOf('Rice'));

  // Sugar's unit price reflects the latest bill (pricePerUnit = true).
  const sugar = products.find((p) => p.productName === 'Sugar');
  assert.equal(sugar.unitPrice, 100);
  assert.equal(sugar.unit, 'kg');

  // Rice's unit price is derived from line total / quantity.
  const rice = products.find((p) => p.productName === 'Rice');
  assert.equal(rice.unitPrice, 100);
  assert.equal(rice.unit, 'kg');

  assert.ok(new Date(products[0].lastBilledAt) > new Date(products[2].lastBilledAt));
});

test('recent-products respects the limit parameter', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/billing/recent-products?limit=2', { token });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.products.length, 2);
});

test('recent-products requires authentication', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/billing/recent-products');
  assert.equal(r.status, 401);
});

test('profile update with avatar clear keeps user intact', async () => {
  const r = await request(baseUrl, 'PUT', '/api/v1/auth/profile', {
    token,
    body: { avatar: '' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.user.avatar, null);
  assert.equal(r.json.data.user.email, 'recent@test.com');
});

test('profile response includes avatar field', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/auth/profile', { token });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.user.avatar, null);
});
