import mongoose from 'mongoose';

const pad = (n) => String(n).padStart(3, '0');

const getLastCustomerNumber = async (prefix) => {
  const { Customer } = await import('../models/Customer.model.js');
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const last = await Customer.findOne({
    customerNumber: new RegExp(`^${escaped}`),
  })
    .sort({ customerNumber: -1 })
    .select('customerNumber')
    .lean();
  const lastSeq = last ? parseInt(last.customerNumber.split('-').pop(), 10) : 0;
  return `${prefix}${pad(lastSeq + 1)}`;
};

export const generateCustomerNumber = async (userId) => {
  const prefix = `CUST-${userId}-`;
  try {
    const db = mongoose.connection.db;
    const counters = db.collection('counters');
    const result = await counters.findOneAndUpdate(
      { _id: prefix },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const seq = result?.seq ?? 1;
    return `${prefix}${pad(seq)}`;
  } catch {
    return getLastCustomerNumber(prefix);
  }
};
