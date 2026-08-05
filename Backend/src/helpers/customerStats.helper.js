import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model.js';
import { customerPurchaseSummary } from './stats.helper.js';

export const refreshCustomerStats = async (customerId) => {
  if (!customerId || !mongoose.isValidObjectId(customerId)) return;

  const summary = await customerPurchaseSummary(customerId);

  await Customer.findByIdAndUpdate(customerId, {
    totalPurchases: summary?.totalPurchases || 0,
  });
};
