import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  spawnServer,
  dropTestDb,
  request,
  registerUser,
} from './helpers/server.mjs'
import 'dotenv/config'

let server
let baseUrl
let token

before(async () => {
  server = await spawnServer({ env: { GEMINI_MOCK: 'ok' } })
  baseUrl = server.baseUrl

  const reg = await request(baseUrl, 'POST', '/api/v1/auth/register', {
    body: {
      ownerName: 'AI Test',
      shopName: 'AI Shop',
      shopType: 'grocery',
      email: 'ai@test.com',
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

test('empty question returns 400 before calling Gemini', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: { question: '' },
  })
  assert.equal(r.status, 400)
})

test('unauthorized request returns 401', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    body: { question: 'today summary' },
  })
  assert.equal(r.status, 401)
})

test(
  'answers today summary with revenue data',
  { timeout: 60000 },
  async () => {
    await request(baseUrl, 'POST', '/api/v1/billing/save', {
      token,
      body: {
        items: [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }],
        paymentMethod: 'cash',
      },
    })

    const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
      token,
      body: { question: 'today summary' },
    })
    assert.equal(r.status, 200, r.json?.message)
    assert.equal(r.json.data.intent, 'today')
    assert.ok(r.json.data.answer.length > 0)
  }
)

test('answers top products question', { timeout: 60000 }, async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: { question: 'which products sell the most?' },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.intent, 'topProducts')
  assert.ok(r.json.data.answer.length > 0)
})

test('answers weekly comparison question', { timeout: 60000 }, async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: { question: 'compare this week with last week' },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.intent, 'weeklyCompare')
  assert.ok(r.json.data.answer.length > 0)
})

test('answers customer question', { timeout: 60000 }, async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: { question: 'who are my top customers?' },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.intent, 'customers')
  assert.ok(r.json.data.answer.length > 0)
})

test('answers pending bills question', { timeout: 60000 }, async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: { question: 'Pending bills' },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.intent, 'pendingBills')
  assert.ok(typeof r.json.data.data.pendingBills.count === 'number')
  assert.ok(r.json.data.answer.length > 0)
})

test('answers Bengali question in Bengali', { timeout: 60000 }, async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: {
      question:
        '\u0986\u099c\u0995\u09c7\u09b0 \u09ac\u09bf\u0995\u09cd\u09b0\u09bf \u0995\u09c7\u09ae\u09a8?',
    },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.intent, 'today')
  assert.ok(r.json.data.answer.length > 0)
})

test('answers Hindi question', { timeout: 60000 }, async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/assistant/ask', {
    token,
    body: {
      question:
        '\u0906\u091c \u0915\u0940 \u092c\u093f\u0915\u094d\u0930\u0940 \u0915\u0948\u0938\u0940 \u0939\u0948?',
    },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.intent, 'today')
  assert.ok(r.json.data.answer.length > 0)
})

test('extracts items from a voice transcript (mocked Gemini)', async () => {
  const r = await request(baseUrl, 'POST', '/api/v1/billing/extract', {
    token,
    body: { transcript: 'two kg rice 200 taka' },
  })
  assert.equal(r.status, 200, r.json?.message)
  assert.equal(r.json.data.items[0].productName, 'Rice')
  assert.equal(r.json.data.items[0].price, 200)
})

test('graceful 502 when Gemini is down', { timeout: 60000 }, async () => {
  const down = await spawnServer({ env: { GEMINI_MOCK: 'fail' } })
  try {
    const reg = await registerUser(down.baseUrl, 'down@test.com')
    const r = await request(down.baseUrl, 'POST', '/api/v1/assistant/ask', {
      token: reg.json.data.accessToken,
      body: { question: 'today summary' },
    })
    assert.equal(r.status, 502)
    assert.match(r.json.message, /AI assistant failed/)
  } finally {
    down.stop()
    await new Promise((resolve) => setTimeout(resolve, 500))
    await dropTestDb(down.dbName)
  }
})
