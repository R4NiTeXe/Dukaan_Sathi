import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnServer, dropTestDb, request } from './helpers/server.mjs';

let server;
let baseUrl;
let token;

before(async () => {
  server = await spawnServer();
  baseUrl = server.baseUrl;
  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'Load Test',
      shopName: 'Load Shop',
      shopType: 'grocery',
      email: 'load@test.com',
      password: 'secret123',
    },
  });
  token = reg.json.data.accessToken;
});

after(async () => {
  server.stop();
  await new Promise((resolve) => setTimeout(resolve, 500));
  await dropTestDb(server.dbName);
});

test('50 parallel bill saves all succeed with unique numbers', { timeout: 120000 }, async () => {
  const bodies = Array.from({ length: 50 }, (_, i) => ({
    items: [{ productName: `Item ${i}`, quantity: 1, unit: 'piece', price: 10 + i }],
    paymentMethod: i % 2 === 0 ? 'cash' : 'upi',
  }));

  const results = await Promise.all(
    bodies.map((body) => request(baseUrl, 'POST', '/api/v1/billing/save', { token, body }))
  );

  const statuses = results.map((r) => r.status);
  assert.ok(
    statuses.every((s) => s === 201),
    `not all succeeded: ${statuses.filter((s) => s !== 201).length} failed`
  );

  const numbers = results.map((r) => r.json.data.bill.billNumber);
  assert.equal(new Set(numbers).size, 50, 'bill numbers must be unique');
  assert.deepEqual(
    numbers.slice().sort(),
    Array.from({ length: 50 }, (_, i) => `BILL-${todayStamp()}-${String(i + 1).padStart(3, '0')}`)
  );
});

const todayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};
