import { saveBill as saveBillService, getRecentProducts } from '../services/billing.service.js';
import { extractBillItems } from '../services/gemini.service.js';
import { matchCatalogItems } from '../services/smartBilling.service.js';
import { saveBillSchema, extractResponseSchema } from '../validators/billing.validator.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const extract = asyncHandler(async (req, res) => {
  const { transcript, language } = req.body;

  if (!transcript || !transcript.trim()) {
    throw new ApiError(400, 'Transcript is required');
  }

  const lang = ['en', 'hi', 'bn'].includes(language) ? language : 'en';

  let items;
  try {
    items = await extractBillItems(transcript.trim(), lang);
  } catch (error) {
    throw new ApiError(502, `AI extraction failed: ${error.message}`);
  }

  const validated = extractResponseSchema.safeParse(items);
  if (!validated.success) {
    throw new ApiError(400, 'AI extraction failed validation', validated.error.issues);
  }

  // Smart Billing: enrich every extracted item with the shop's saved catalog.
  // Known items get their stored price/unit/tax; unknown items keep Gemini's
  // output and are flagged so the UI can ask for a price (and learn it).
  const enriched = await matchCatalogItems({ userId: req.user._id, items: validated.data });

  return res
    .status(200)
    .json(new ApiResponse(200, { items: enriched }, 'Items extracted'));
});

const saveBill = asyncHandler(async (req, res) => {
  const validated = saveBillSchema.safeParse(req.body);
  if (!validated.success) {
    throw new ApiError(400, 'Invalid bill data', validated.error.issues);
  }

  const bill = await saveBillService(req.user._id, validated.data);

  return res.status(201).json(new ApiResponse(201, { bill }, 'Bill saved'));
});

const recentProducts = asyncHandler(async (req, res) => {
  const products = await getRecentProducts(req.user._id, req.query.limit);
  return res.status(200).json(new ApiResponse(200, { products }, 'Recent products fetched'));
});

export { extract, saveBill, recentProducts };
