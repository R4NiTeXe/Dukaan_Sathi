import mongoose from 'mongoose';
import { Bill } from '../models/Bill.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfWeek = () => {
  const d = startOfDay();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const summary = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const [result] = await Bill.aggregate([
    { $match: { userId } },
    {
      $facet: {
        totalBills: [{ $count: 'count' }],
        totalRevenue: [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }],
        todayRevenue: [
          { $match: { createdAt: { $gte: startOfDay() } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ],
        monthlyRevenue: [
          { $match: { createdAt: { $gte: startOfMonth() } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ],
        billsThisWeek: [{ $match: { createdAt: { $gte: startOfWeek() } } }, { $count: 'count' }],
        recentBills: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'customers',
              localField: 'customerId',
              foreignField: '_id',
              as: 'customer',
            },
          },
          { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              billNumber: 1,
              totalAmount: 1,
              paymentMethod: 1,
              paymentStatus: 1,
              createdAt: 1,
              customer: { $ifNull: ['$customer.name', null] },
            },
          },
        ],
        topCustomers: [
          { $match: { customerId: { $ne: null } } },
          {
            $group: {
              _id: '$customerId',
              totalSpent: { $sum: '$totalAmount' },
              billCount: { $sum: 1 },
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
              _id: 1,
              name: '$customer.name',
              phone: '$customer.phone',
              totalSpent: 1,
              billCount: 1,
            },
          },
        ],
      },
    },
  ]);

  const data = {
    totalBills: result.totalBills[0]?.count || 0,
    totalRevenue: result.totalRevenue[0]?.total || 0,
    todayRevenue: result.todayRevenue[0]?.total || 0,
    monthlyRevenue: result.monthlyRevenue[0]?.total || 0,
    billsThisWeek: result.billsThisWeek[0]?.count || 0,
    recentBills: result.recentBills || [],
    topCustomers: result.topCustomers || [],
  };

  return res.status(200).json(new ApiResponse(200, data, 'Dashboard summary'));
});

export { summary };
