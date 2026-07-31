import { GoogleGenerativeAI } from '@google/generative-ai'
import config from '../config/index.js'

const genAI = new GoogleGenerativeAI(config.gemini.apiKey)

const PROMPT = `You are a billing assistant for a local Indian shop.
The shop owner speaks in Bengali or Hindi to describe items being sold.

Extract ALL items from the text. For each item, extract:
- productName (in English)
- quantity (number)
- unit (kg, piece, pack, liter, gram, dozen, etc.)
- price (total price for that quantity, in INR)

Rules:
- If quantity is not mentioned, assume 1
- If unit is not mentioned, assume "piece"
- Translate product names to English
- Return ONLY valid JSON array, no explanation

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

const ASSISTANT_PROMPT = `You are a business analytics assistant for a local shop owner.
You can ONLY answer using the provided business data.
Do NOT invent or assume any information not present in the data.
If the data does not contain an answer, say you do not have enough data.

Shop Data:
{data}

Owner's Question: "{question}"

Answer concisely in a helpful, friendly tone (max 5-6 sentences).
Use numbers and specifics from the data.
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
  const model = genAI.getGenerativeModel({ model: config.gemini.model })
  const result = await generateWithRetry(
    model,
    ASSISTANT_PROMPT.replace('{data}', JSON.stringify(data)).replace(
      '{question}',
      question
    )
  )
  return result.response.text().trim()
}

export const pingGemini = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: config.gemini.model })
    await withTimeout(
      model.generateContent('Reply with exactly: OK'),
      5000,
      'Gemini ping timed out'
    )
    return true
  } catch {
    return false
  }
}
