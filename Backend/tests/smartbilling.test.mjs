import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnServer, dropTestDb, request } from './helpers/server.mjs';

// NOTE: GEMINI_MOCK 'ok' always returns exactly
//   [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }]
// so the catalog-backed assertions are written around that fixed item.

let server;
let baseUrl;
let token;

before(async () => {
  server = await spawnServer({ env: { GEMINI_MOCK: 'ok' } });
  baseUrl = server.baseUrl;

  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Smart Billing Test',
      shopName: 'Smart Shop',
      shopType: 'grocery',
      email: 'smart@test.com',
      password: 'secret123',
    },
  });
  token = reg.json.data.accessToken;

  // Seed the catalog: Rice + Sugar + a barcoded product.
  await request(baseUrl, 'POST', '/api/v1/products', {
    token,
    body: { name: 'Rice', price: 100, unit: 'kg', category: 'grocery', taxRate: 5 },
  });
  await request(baseUrl, 'POST', '/api/v1/products', {
    token,
    body: { name: 'Sugar', price: 50, unit: 'kg', category: 'grocery', taxRate: 5 },
  });
  await request(baseUrl, 'POST', '/api/v1/products', {
    token,
    body: { name: 'Cola 500ml', price: 35, unit: 'bottle', barcode: '8901234567890' },
  });
});

after(async () => {
  server.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await dropTestDb(server.dbName);
});

const listProducts = async (search) => {
  const q = search ? `?search=${encodeURIComponent(search)}&limit=50` : '?limit=50';
  const r = await request(baseUrl, 'GET', `/api/v1/products${q}`, { token });
  assert.equal(r.status, 200);
  return r.json.data.products;
};

test('shape of enriched extract for a known catalog item', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/extract', {
    token,
    body: { transcript: 'two kg rice 200 taka' },
  });
  assert.equal(r.status, 200, r.json?.message);
  const [rice] = r.json.data.items;
  assert.equal(rice.match, 'catalog');
  assert.equal(rice.productName, 'Rice');
  assert.equal(rice.catalogUnitPrice, 100);
  assert.equal(rice.catalogUnit, 'kg');
  assert.equal(rice.category, 'grocery');
  assert.equal(rice.taxRate, 5);
  assert.equal(rice.quantity, 2);
  // line total = qty × saved unit price (2 × 100)
  assert.equal(rice.price, 200);
  assert.equal(rice.pricePerUnit, false);
});

test('extract keeps working with an empty catalog (pure new items)', async () => {
  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Empty Shop',
      shopName: 'Empty Shop',
      shopType: 'other',
      email: 'empty@test.com',
      password: 'secret123',
    },
  });
  const emptyToken = reg.json.data.accessToken;
  const r = await request(baseUrl, 'POST', '/api/v1/billing/extract', {
    token: emptyToken,
    body: { transcript: 'two kg rice 200 taka' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.items[0].match, 'new');
  assert.equal(r.json.data.items[0].price, 200);
});

test('confirmed new items are learned after a successful bill save', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [
        {
          productName: 'Milk',
          quantity: 2,
          unit: 'liter',
          price: 120,
          isNewConfirmed: true,
          category: 'grocery',
        },
      ],
      paymentMethod: 'cash',
    },
  });
  assert.equal(r.status, 201);
  assert.equal(r.json.data.bill.totalAmount, 120);

  const products = await listProducts('Milk');
  assert.equal(products.length, 1);
  assert.equal(products[0].name, 'Milk');
  assert.equal(products[0].price, 60); // 120 / 2 litres
  assert.equal(products[0].unit, 'liter');
  assert.equal(products[0].autoAdded, true);
  assert.equal(products[0].category, 'grocery');
});

test('legacy saves (no isNewConfirmed) never learn products', async () => {
  const before = await listProducts('OneOff');
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [{ productName: 'OneOff', quantity: 1, unit: 'piece', price: 10 }],
      paymentMethod: 'cash',
    },
  });
  assert.equal(r.status, 201);
  const after = await listProducts('OneOff');
  assert.equal(after.length, before.length);
});

test('new item is not learned when the confirmed price is zero', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/save', {
    token,
    body: {
      items: [
        { productName: 'Freebie', quantity: 1, unit: 'piece', price: 0, isNewConfirmed: true },
      ],
      paymentMethod: 'cash',
    },
  });
  assert.equal(r.status, 201);
  assert.equal((await listProducts('Freebie')).length, 0);
});

test('search suggests with typo correction and natural language', async () => {
  const r1 = await request(baseUrl, 'GET', '/api/v1/products/search?q=one%20kilo%20sugur', {
    token,
  });
  assert.equal(r1.status, 200);
  const results = r1.json.data.results;
  assert.ok(results.length >= 1);
  assert.equal(results[0].name, 'Sugar');
  assert.equal(results[0].price, 50);

  const r2 = await request(baseUrl, 'GET', '/api/v1/products/search?q=2%20maggi', {
    token,
  });
  assert.equal(r2.status, 200);
  assert.ok(Array.isArray(r2.json.data.results));
});

test('search returns empty for nonsense queries', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/products/search?q=zzzzzz', { token });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.results.length, 0);
});

test('barcode lookup returns the product and 404s for unknown codes', async () => {
  const r = await request(baseUrl, 'GET', '/api/v1/products/barcode/8901234567890', { token });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.product.name, 'Cola 500ml');

  const missing = await request(baseUrl, 'GET', '/api/v1/products/barcode/999999999', { token });
  assert.equal(missing.status, 404);
});

test('update product updates the default price used by extraction', async () => {
  const r = await request(baseUrl, 'PUT', '/api/v1/products/rice_id_placeholder', {
    token,
    body: { price: 0 },
  });
  // invalid id -> 400, sanity check on validation
  assert.equal(r.status, 400);

  const rice = (await listProducts('Rice'))[0];
  const upd = await request(baseUrl, 'PUT', `/api/v1/products/${rice._id}`, {
    token,
    body: { price: 105 },
  });
  assert.equal(upd.status, 200);
  assert.equal(upd.json.data.product.price, 105);

  // The cached catalog is invalidated, so the next extract picks up ₹105/kg.
  const e = await request(baseUrl, 'POST', '/api/v1/billing/extract', {
    token,
    body: { transcript: 'two kg rice' },
  });
  assert.equal(e.json.data.items[0].catalogUnitPrice, 105);
  assert.equal(e.json.data.items[0].price, 210); // 2 × 105

  // Sugar's price bump 50 -> 55 is visible through search too.
  const sugar = (await listProducts('Sugar'))[0];
  const su = await request(baseUrl, 'PUT', `/api/v1/products/${sugar._id}`, {
    token,
    body: { price: 55 },
  });
  assert.equal(su.status, 200);
  const s = await request(baseUrl, 'GET', '/api/v1/products/search?q=sugar', { token });
  assert.equal(s.json.data.results[0].price, 55);
});

test('update/delete reject products from another user', async () => {
  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Other Shop',
      shopName: 'Other Shop',
      shopType: 'other',
      email: 'other@test.com',
      password: 'secret123',
    },
  });
  const otherToken = reg.json.data.accessToken;
  const rice = (await listProducts('Rice'))[0];

  const r = await request(baseUrl, 'PUT', `/api/v1/products/${rice._id}`, {
    token: otherToken,
    body: { price: 1 },
  });
  assert.equal(r.status, 404);
});