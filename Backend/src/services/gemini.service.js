import { GoogleGenerativeAI } from '@google/generative-ai'
import config from '../config/index.js'

const GEMINI_MOCK = process.env.GEMINI_MOCK

const genAI = GEMINI_MOCK ? null : new GoogleGenerativeAI(config.gemini.apiKey)

const PROMPT = `You are a billing assistant for a local Indian shop.
The shop owner describes items a customer is buying in Bengali, Hindi, or English.

The owner spoke in {language} (bn = Bengali, hi = Hindi, en = English). Interpret quantity words and item names in that language (e.g. ek/dui/tin, do/teen/dos = 1/2/3; chaal -> Rice, chini -> Sugar, dudh -> Milk, chai -> Tea, aata/atta -> Atta, sabun -> Soap).

Extract EVERY item the customer is buying — never skip, merge, or drop any item.
For each item, extract:
- productName (in English)
- quantity (number of units)
- unit (kg, piece, pack, liter, gram, dozen, etc.)
- price (INR) — the TOTAL price the owner said for that item line (e.g. "2 kg rice 120 rupees" means price = 120; "rice 50 rupees" means price = 50). If the owner EXPLICITLY said a per-unit price (e.g. "rice 120 rupees per kilo"), set price to that unit value AND set "pricePerUnit": true. NEVER divide, multiply, or compute — copy the spoken number exactly as-is. Use 0 if no price was spoken — never guess or invent a price)

Rules:
- If quantity is not mentioned, assume 1
- If unit is not mentioned, assume "piece"
- Translate item names to English
- Include ONLY real purchased items. Ignore greetings, filler words, and phrases like "total X rupees"
- Never invent items or categories
- If no real items are mentioned, return []

Return ONLY a valid JSON array, no explanation, no markdown.

Input: "{transcribed_text}"

Output format:
[{"productName": "...", "quantity": ..., "unit": "...", "price": ..., "pricePerUnit": false}]`

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

CRITICAL FINANCIAL RULE:
ALWAYS use the Indian Rupee symbol (₹) for ALL monetary values and amounts. NEVER use the dollar sign ($) or the word 'dollars' under any circumstances. If the user mentions money, assume they mean Rupees (₹).

Shop Data:
{data}

Owner's Question: "{question}"

Answer in a helpful, friendly tone.
If answering a business question, use numbers and specifics from the data.
Format your answer beautifully using Markdown (bold text, lists).

CRITICAL: When mentioning the payment status or payment mode of bills, you MUST use symbols (not emojis) and HTML span tags for colors:
- For Paid bills: Use <span class="text-emerald font-bold">✓ Paid</span>
- For Unpaid/Pending bills: Use <span class="text-red-500 font-bold">✗ Unpaid</span>
- For Cash payment mode: Use <span class="text-neutral-700 font-semibold">[₹] Cash</span>
- For UPI payment mode: Use <span class="text-neutral-700 font-semibold">[QR] UPI</span>

Never confuse Paid and Unpaid bills. Read the provided data carefully.
If the owner asked in Bengali or Hindi, answer in that language but keep the HTML formatting.
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

export const extractBillItems = async (transcript, language = 'en') => {
  if (GEMINI_MOCK === 'ok') {
    return [{ productName: 'Rice', quantity: 2, unit: 'kg', price: 200 }]
  }
  const model = genAI.getGenerativeModel({ model: config.gemini.model })
  const result = await generateWithRetry(
    model,
    PROMPT.replace('{transcribed_text}', transcript).replace('{language}', language)
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
        pricePerUnit: item.pricePerUnit === true,
      }))
      .filter((item) => item.price > 0 || item.quantity > 0)
  } catch (error) {
    throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`, {
      cause: error,
    })
  }
}

export const askAssistant = async (dataContext, question, user) => {
  if (!genAI) {
    return 'Demo Mode: This is a placeholder AI response because GEMINI_MOCK is enabled.'
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const promptContext = ASSISTANT_PROMPT.replace('{data}', JSON.stringify(dataContext))
      .replace('{question}', question)
      .replace('{current_date}', new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

    const result = await withTimeout(
      model.generateContent(promptContext),
      GENERATE_TIMEOUT_MS,
      'AI response timed out'
    )
    return result.response.text()
  } catch (error) {
    console.error('Gemini Assistant Error:', error)
    throw new Error('Failed to generate AI response: ' + error.message)
  }
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
