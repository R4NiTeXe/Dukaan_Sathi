import mongoose from 'mongoose'
import { Bill } from '../models/Bill.model.js'

export const revenueByPeriod = async (userId, { since, format, outputKey }) => {
  return Bill.aggregate([
    { $match: { userId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        billCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        [outputKey]: '$_id',
        totalRevenue: 1,
        billCount: 1,
      },
    },
  ])
}

export const topProductsByRevenue = async (userId, limit) => {
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
  ])
}

export const customerPurchaseSummary = async (customerId) => {
  const [result] = await Bill.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        lastPurchase: { $max: '$createdAt' },
      },
    },
  ])
  return result || null
}
