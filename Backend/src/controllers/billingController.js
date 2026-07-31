import { Bill } from '../models/Bill.js';
import { extractBillItems } from '../services/geminiService.js';
import { extractResponseSchema, saveBillSchema } from '../validators/billingValidator.js';
import { generateBillNumber } from '../helpers/billNumber.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const extract = asyncHandler(async (req, res) => {
  const { transcript } = req.body;

  if (!transcript || !transcript.trim()) {
    throw new ApiError(400, 'Transcript is required');
  }

  let items;
  try {
    items = await extractBillItems(transcript.trim());
  } catch (error) {
    throw new ApiError(502, `AI extraction failed: ${error.message}`);
  }

  const validated = extractResponseSchema.safeParse(items);
  if (!validated.success) {
    throw new ApiError(400, 'AI extraction failed validation', validated.error.issues);
  }

  return res.status(200).json(new ApiResponse(200, { items: validated.data }, 'Items extracted'));
});

const saveBill = asyncHandler(async (req, res) => {
  const validated = saveBillSchema.safeParse(req.body);
  if (!validated.success) {
    throw new ApiError(400, 'Invalid bill data', validated.error.issues);
  }

  const { items, paymentMethod } = validated.data;
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const billNumber = await generateBillNumber();

  const bill = await Bill.create({
    userId: req.user._id,
    billNumber,
    items,
    totalAmount,
    paymentMethod,
  });

  return res.status(201).json(new ApiResponse(201, { bill }, 'Bill saved'));
});

export { extract, saveBill };
