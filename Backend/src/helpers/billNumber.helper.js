import mongoose from 'mongoose';

const pad = (n) => String(n).padStart(3, '0');
const dateString = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

export const generateBillNumber = async () => {
  const prefix = `BILL-${dateString()}-`;
  const db = mongoose.connection.db;
  const counters = db.collection('counters');
  const result = await counters.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = result?.seq ?? 1;
  return `${prefix}${pad(seq)}`;
};
