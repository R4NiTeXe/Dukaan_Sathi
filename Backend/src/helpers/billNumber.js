import { Bill } from '../models/Bill.js';

const pad = (n) => String(n).padStart(3, '0');

const dateString = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

export const generateBillNumber = async () => {
  const prefix = `BILL-${dateString()}-`;
  const lastBill = await Bill.findOne({ billNumber: { $regex: `^${prefix}` } }).sort({ billNumber: -1 });
  const nextSequence = lastBill ? parseInt(lastBill.billNumber.split('-').pop(), 10) + 1 : 1;
  return `${prefix}${pad(nextSequence)}`;
};
