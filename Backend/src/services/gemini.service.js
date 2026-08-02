import { GoogleGenerativeAI } from '@google/generative-ai'
import config from '../config/index.js'

const GEMINI_MOCK = process.env.GEMINI_MOCK

const genAI = GEMINI_MOCK ? null : new GoogleGenerativeAI(config.gemini.apiKey)

const PROMPT = `You are a billing assistant for a local Indian shop.
The shop owner speaks in Bengali, Hindi, or English describing items a customer is buying.

Extract EVERY item the customer is buying — never skip, merge, or drop any item.
For each item, extract:
- productName (in English)
- quantity (number)
- unit (kg, piece, pack, liter, gram, dozen, etc.)
- price (total price for that quantity, in INR; use 0 if the price was not spoken — never guess or invent a price)

Rules:
- If quantity is not mentioned, assume 1
- If unit is not mentioned, assume "piece"
- Translate item names to English (e.g. chaal -> Rice, chini -> Sugar, dudh -> Milk, chai -> Tea, rosogulla -> Rosogulla)
- Include ONLY real purchased items. Ignore greetings, filler words, and phrases like "total X rupees"
- Never invent items or categories
- If no real items are mentioned, return []

Return ONLY a valid JSON array, no explanation, no markdown.

Input: "{transcribed_text}"

Output format:
[{"productName": "...", "quantity": ..., "unit": "...", "price": ...}]`

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ])

const GENERATE_TIMEOUT_MS = 20000

const ASSISTANT_PROMPT = `You are an AI assistant for a local shop owner.
If the owner asks general knowledge questions or chats with you, answer normally. Do NOT introduce yourself repeatedly unless asked.
For questions specifically about their business, answer using ONLY the data provided below.
CRITICAL: Do NOT mention their business data (like revenue or bills) UNLESS they specifically ask a business-related question.

Today's date is {current_date}.
IMPORTANT: For any question about the date, day, time, or "today", use the date above — never guess, invent, or answer from your training data.

Shop Data:
{data}

Owner's Question: "{question}"

Answer in a helpful, friendly tone.
If answering a business question, use numbers and specifics from the data.
If the owner asked in Bengali or Hindi, answer in that language.
Return ONLY the answer text, no JSON.`

const generateWithRetry = async (model, prompt, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await withTimeout(
        model.generateContent(prompt),
        GENERATE_TIMEOUT_MS,
        'Gemini request timed out'
      )
    } catch (error) {
      const isRateLimit = /503|429|RESOURCE_EXHAUSTED|high demand/i.test(
        error.message
      )
      if (!isRateLimit || attempt === attempts) throw error
      await delay(2000 * attempt)
    }
  }
  throw new Error('Gemini request failed after retries')
}

export const extractBillItems = async (transcript) => {
  if (GEMINI_MOCK === 'ok') {
    return [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }]
  }
  const model = genAI.getGenerativeModel({ model: config.gemini.model })
  const result = await generateWithRetry(
    model,
    PROMPT.replace('{transcribed_text}', transcript)
  )
  const rawText = result.response.text().trim()

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.productName === 'string' &&
          item.productName.trim()
      )
      .map((item) => ({
        productName: item.productName.trim(),
        quantity:
          typeof item.quantity === 'number' && item.quantity > 0
            ? item.quantity
            : 1,
        unit:
          typeof item.unit === 'string' && item.unit.trim()
            ? item.unit.trim()
            : 'piece',
        price:
          typeof item.price === 'number' && item.price >= 0 ? item.price : 0,
      }))
      .filter((item) => item.price > 0 || item.quantity > 0)
  } catch (error) {
    throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`, {
      cause: error,
    })
  }
}

export const askAssistant = async (question, data) => {
  if (GEMINI_MOCK === 'ok') {
    return 'Mocked answer: revenue 200 INR from 1 bill today.'
  }
  if (GEMINI_MOCK === 'fail') {
    throw new Error('Gemini unavailable (test mock)')
  }
  const model = genAI.getGenerativeModel({ model: config.gemini.model })
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const result = await generateWithRetry(
    model,
    ASSISTANT_PROMPT.replace('{current_date}', today)
      .replace('{data}', JSON.stringify(data))
      .replace('{question}', question)
  )
  return result.response.text().trim()
}

let lastGeminiPing = { at: 0, ok: false }
const GEMINI_PING_TTL_MS = 10 * 60 * 1000

export const pingGemini = async () => {
  if (GEMINI_MOCK === 'ok') return true
  if (GEMINI_MOCK === 'fail') return false
  if (Date.now() - lastGeminiPing.at < GEMINI_PING_TTL_MS) {
    return lastGeminiPing.ok
  }
  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.model })
    await withTimeout(
      model.countTokens({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      }),
      5000,
      'Gemini ping timed out'
    )
    lastGeminiPing = { at: Date.now(), ok: true }
    return true
  } catch {
    lastGeminiPing = { at: Date.now(), ok: false }
    return false
  }
}
