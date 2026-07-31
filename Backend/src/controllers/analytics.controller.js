import mongoose from 'mongoose';
import { Bill } from '../models/Bill.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const monthly = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const monthsAgo = new Date();
  monthsAgo.setDate(1);
  monthsAgo.setMonth(monthsAgo.getMonth() - 5);

  const result = await Bill.aggregate([
    { $match: { userId, createdAt: { $gte: monthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        billCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        month: '$_id',
        totalRevenue: 1,
        billCount: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { data: result }, 'Monthly analytics'));
});

const weekly = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const result = await Bill.aggregate([
    { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        billCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        totalRevenue: 1,
        billCount: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { data: result }, 'Weekly analytics'));
});

const topProducts = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const result = await Bill.aggregate([
    { $match: { userId } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalRevenue: { $sum: '$items.price' },
        totalQuantity: { $sum: '$items.quantity' },
        timesSold: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        productName: '$_id',
        totalRevenue: 1,
        totalQuantity: 1,
        timesSold: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { data: result }, 'Top products'));
});

const customerReport = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const result = await Bill.aggregate([
    { $match: { userId, customerId: { $ne: null } } },
    {
      $group: {
        _id: '$customerId',
        billCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        lastPurchase: { $max: '$createdAt' },
      },
    },
    { $sort: { totalSpent: -1 } },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 0,
        customerId: '$_id',
        name: '$customer.name',
        phone: '$customer.phone',
        billCount: 1,
        totalSpent: 1,
        lastPurchase: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, { data: result }, 'Customer report'));
});

export { monthly, weekly, topProducts, customerReport };
