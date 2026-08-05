import mongoose from 'mongoose';
import { Bill } from '../models/Bill.model.js';
import { Customer } from '../models/Customer.model.js';
import { askAssistant, pingGemini } from '../services/gemini.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const detectIntent = (question) => {
  const q = question.toLowerCase();

  if (
    /best seller|best selling|top product|top selling|popular|bestseller|sell(s|ing)? the most|sold the most|सबसे ज्यादा|सबसे अच्छा|बेस्ट सेलर|সবচেয়ে বেশি|সেরা|বেস্ট সেলার/.test(
      q
    )
  ) {
    return 'topProducts';
  }
  if (/compare|last week|previous week|versus|vs/.test(q)) {
    return 'weeklyCompare';
  }
  if (/customer|ग्राहक|গ্রাহক/.test(q)) {
    return 'customers';
  }
  if (/pending|unpaid|due|बकाया|বকেয়া/.test(q)) {
    return 'pendingBills';
  }
  if (/month|trend|this month|monthly|महीना|মাস/.test(q)) {
    return 'monthlyTrend';
  }
  if (/today|today's|aaj|आज|আজ/.test(q)) {
    return 'today';
  }
  return 'summary';
};

const fetchTopProducts = async (userId) => {
  return Bill.aggregate([
    { $match: { userId } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productName',
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$items.pricePerUnit', true] },
              { $multiply: ['$items.price', '$items.quantity'] },
              '$items.price',
            ],
          },
        },
        totalQuantity: { $sum: '$items.quantity' },
        timesSold: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
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
};

const fetchWeeklyCompare = async (userId) => {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const [thisWeek] = await Bill.aggregate([
    { $match: { userId, createdAt: { $gte: thisWeekStart } } },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalAmount' },
        bills: { $sum: 1 },
      },
    },
  ]);
  const [lastWeek] = await Bill.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: lastWeekStart, $lt: thisWeekStart },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$totalAmount' },
        bills: { $sum: 1 },
      },
    },
  ]);

  return {
    thisWeek: thisWeek || { revenue: 0, bills: 0 },
    lastWeek: lastWeek || { revenue: 0, bills: 0 },
  };
};

const fetchCustomers = async (userId) => {
  const topCustomers = await Bill.aggregate([
    { $match: { userId, customerId: { $ne: null } } },
    {
      $group: {
        _id: '$customerId',
        billCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
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
        customerNumber: '$customer.customerNumber',
        billCount: 1,
        totalSpent: 1,
      },
    },
  ]);

  const totalCustomers = await Customer.countDocuments({ userId });
  return { totalCustomers, topCustomers };
};

const fetchMonthlyTrend = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  return Bill.aggregate([
    { $match: { userId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        billCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, month: '$_id', totalRevenue: 1, billCount: 1 } },
  ]);
};

const fetchUnpaidBills = async (userId) => {
  const userIdObj = new mongoose.Types.ObjectId(userId);
  const [result] = await Bill.aggregate([
    { $match: { userId: userIdObj, paymentStatus: { $ne: 'paid' } } },
    {
      $facet: {
        count: [{ $count: 'c' }],
        totalAmount: [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 0,
              billNumber: 1,
              totalAmount: 1,
              paymentMethod: 1,
              paymentStatus: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ]);

  return {
    count: result?.count?.[0]?.c || 0,
    totalAmount: result?.totalAmount?.[0]?.total || 0,
    recent: result?.recent || [],
  };
};

const fetchToday = async (userId) => {
  const userIdObj = new mongoose.Types.ObjectId(userId);
  const [result] = await Bill.aggregate([
    { $match: { userId: userIdObj, createdAt: { $gte: startOfDay() } } },
    {
      $facet: {
        revenue: [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }],
        count: [{ $count: 'c' }],
        byMethod: [
          {
            $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' } },
          },
          { $project: { _id: 0, method: '$_id', total: 1 } },
        ],
      },
    },
  ]);

  return {
    revenue: result?.revenue?.[0]?.total || 0,
    billCount: result?.count?.[0]?.c || 0,
    byMethod: result?.byMethod || [],
  };
};

const fetchSummary = async (userId) => {
  const userIdObj = new mongoose.Types.ObjectId(userId);
  const [result] = await Bill.aggregate([
    { $match: { userId: userIdObj } },
    {
      $facet: {
        totalBills: [{ $count: 'c' }],
        totalRevenue: [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }],
        monthlyRevenue: [
          { $match: { createdAt: { $gte: startOfMonth() } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ],
        paymentBreakdown: [
          {
            $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' } },
          },
          { $project: { _id: 0, method: '$_id', total: 1 } },
        ],
      },
    },
  ]);

  return {
    totalBills: result?.totalBills?.[0]?.c || 0,
    totalRevenue: result?.totalRevenue?.[0]?.total || 0,
    monthlyRevenue: result?.monthlyRevenue?.[0]?.total || 0,
    paymentBreakdown: result?.paymentBreakdown || [],
  };
};

const ask = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    throw new ApiError(400, 'Question is required');
  }

  const userId = req.user._id;
  const intent = detectIntent(question);

  let data;
  switch (intent) {
    case 'topProducts':
      data = { topProducts: await fetchTopProducts(userId) };
      break;
    case 'weeklyCompare':
      data = await fetchWeeklyCompare(userId);
      break;
    case 'customers':
      data = await fetchCustomers(userId);
      break;
    case 'pendingBills':
      data = { pendingBills: await fetchUnpaidBills(userId) };
      break;
    case 'monthlyTrend':
      data = { monthlyTrend: await fetchMonthlyTrend(userId) };
      break;
    case 'today':
      data = { today: await fetchToday(userId) };
      break;
    default:
      data = await fetchSummary(userId);
  }

  let answer;
  try {
    answer = await askAssistant(data, question, req.user);
  } catch (error) {
    throw new ApiError(502, `AI assistant failed: ${error.message}`);
  }

  return res.status(200).json(new ApiResponse(200, { answer, intent, data }, 'Answer generated'));
});

export const checkHealth = asyncHandler(async (req, res) => {
  const ping = await pingGemini();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isUp: ping.ok, model: ping.model, checkedAt: ping.checkedAt },
        'AI Health Status'
      )
    );
});

export { ask };
