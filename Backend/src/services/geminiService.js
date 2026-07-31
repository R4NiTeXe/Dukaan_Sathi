import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
[{"productName": "...", "quantity": ..., "unit": "...", "price": ...}]`;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateWithRetry = async (model, prompt, attempts = 3) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      const isRateLimit = /503|429|RESOURCE_EXHAUSTED|high demand/i.test(error.message);
      if (!isRateLimit || attempt === attempts) throw error;
      await delay(2000 * attempt);
    }
  }
  throw new Error('Gemini request failed after retries');
};

export const extractBillItems = async (transcript) => {
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-flash-latest' });
  const result = await generateWithRetry(model, PROMPT.replace('{transcribed_text}', transcript));
  const rawText = result.response.text().trim();

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Gemini returned invalid JSON: ${rawText.slice(0, 200)}`);
  }
};
