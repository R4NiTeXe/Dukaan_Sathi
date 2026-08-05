import mongoose from 'mongoose';
import { Bill } from '../models/Bill.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const listBills = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const { search, startDate, endDate, paymentMethod, paymentStatus, sortBy, sortOrder } = req.query;

  const filter = { userId: req.user._id };

  if (search) {
    filter.$or = [
      { billNumber: { $regex: search, $options: 'i' } },
      { 'items.productName': { $regex: search, $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const sortField = sortBy === 'totalAmount' ? 'totalAmount' : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customerId', 'customerNumber')
      .select('billNumber items totalAmount paymentMethod paymentStatus customerId createdAt')
      .lean(),
    Bill.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      bills,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  );
});

const getBillById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid bill id');
  }

  const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('customerId', 'customerNumber')
    .lean();
  if (!bill) {
    throw new ApiError(404, 'Bill not found');
  }

  return res.status(200).json(new ApiResponse(200, { bill }));
});

export { listBills, getBillById };
