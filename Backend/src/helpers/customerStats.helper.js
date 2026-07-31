import mongoose from 'mongoose';
import { Bill } from '../models/Bill.model.js';
import { Customer } from '../models/Customer.model.js';

export const refreshCustomerStats = async (customerId) => {
  if (!customerId || !mongoose.isValidObjectId(customerId)) return;

  const [result] = await Bill.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(customerId) } },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        lastPurchase: { $max: '$createdAt' },
      },
    },
  ]);

  await Customer.findByIdAndUpdate(customerId, {
    totalPurchases: result?.totalPurchases || 0,
    lastPurchase: result?.lastPurchase || null,
  });
};
