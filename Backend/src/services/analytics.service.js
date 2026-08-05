import { Bill } from '../models/Bill.model.js';
import { revenueByPeriod, topProductsByRevenue } from '../helpers/stats.helper.js';

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

export const dashboardSummary = async (userId) => {
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
              customer: { $ifNull: ['$customer.customerNumber', null] },
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
              customerNumber: '$customer.customerNumber',
              totalSpent: 1,
              billCount: 1,
            },
          },
        ],
        paymentModes: [
          {
            $group: {
              _id: {
                $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 'unpaid', '$paymentMethod'],
              },
              total: { $sum: '$totalAmount' },
              count: { $sum: 1 },
            },
          },
        ],
        unpaidBills: [{ $match: { paymentStatus: 'pending' } }, { $count: 'count' }],
      },
    },
  ]);

  return {
    totalBills: result.totalBills[0]?.count || 0,
    totalRevenue: result.totalRevenue[0]?.total || 0,
    todayRevenue: result.todayRevenue[0]?.total || 0,
    monthlyRevenue: result.monthlyRevenue[0]?.total || 0,
    billsThisWeek: result.billsThisWeek[0]?.count || 0,
    recentBills: result.recentBills || [],
    topCustomers: result.topCustomers || [],
    paymentModes: result.paymentModes || [],
    unpaidBills: result.unpaidBills?.[0]?.count || 0,
  };
};

export const monthlyRevenue = async (userId) => {
  const monthsAgo = new Date();
  monthsAgo.setDate(1);
  monthsAgo.setMonth(monthsAgo.getMonth() - 5);

  return revenueByPeriod(userId, {
    since: monthsAgo,
    format: '%Y-%m',
    outputKey: 'month',
  });
};

export const weeklyRevenue = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  return revenueByPeriod(userId, {
    since: sevenDaysAgo,
    format: '%Y-%m-%d',
    outputKey: 'date',
  });
};

export const topProducts = async (userId, limit = 10) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  return topProductsByRevenue(userId, safeLimit);
};

export const customerReport = async (userId) => {
  return Bill.aggregate([
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
        customerNumber: '$customer.customerNumber',
        billCount: 1,
        totalSpent: 1,
        lastPurchase: 1,
      },
    },
  ]);
};
