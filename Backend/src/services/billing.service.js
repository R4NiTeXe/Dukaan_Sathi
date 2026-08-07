import { Bill } from '../models/Bill.model.js';
import { generateBillNumber } from '../helpers/billNumber.helper.js';
import { refreshCustomerStats } from '../helpers/customerStats.helper.js';
import { autoAddProducts } from '../helpers/productAutoAdd.helper.js';
import { learnItems } from './smartBilling.service.js';

export const saveBill = async (userId, data) => {
  const { items, paymentMethod, paymentStatus, customerId } = data;
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.pricePerUnit ? item.price * item.quantity : item.price),
    0
  );
  const billNumber = await generateBillNumber();

  const bill = await Bill.create({
    userId,
    billNumber,
    items,
    totalAmount,
    paymentMethod,
    paymentStatus: paymentStatus || 'paid',
    customerId: customerId || null,
  });

  if (bill.customerId) {
    await refreshCustomerStats(bill.customerId);
  }

  // Smart Billing: learn items the cashier explicitly confirmed as new
  // (name + price verified in the UI). The legacy threshold-based auto-add
  // below stays untouched for API-only billing.
  try {
    const confirmed = items.filter((item) => item.isNewConfirmed === true);
    if (confirmed.length > 0) {
      await learnItems({ userId, items: confirmed });
    }
  } catch (error) {
    console.error('smartBilling learnItems failed:', error.message);
  }

  try {
    await autoAddProducts(userId, items);
  } catch (error) {
    console.error('autoAddProducts failed:', error.message);
  }

  return bill;
};

// Most recently billed products for the Smart Billing quick-pick list.
// Groups distinct product names across bills and keeps, for each product,
// the row (unit, price, timestamp) from its most recent bill.
export const getRecentProducts = async (userId, limit = 15) => {
  const cap = Math.min(Math.max(Number(limit) || 15, 1), 30);

  const rows = await Bill.aggregate([
    { $match: { userId } },
    // Projected before unwind so grouping picks the latest bill per item.
    { $sort: { createdAt: -1 } },
    { $unwind: '$items' },
    {
      $group: {
        _id: { $toLower: { $trim: { input: '$items.productName' } } },
        productName: { $first: '$items.productName' },
        unit: { $first: '$items.unit' },
        price: { $first: '$items.price' },
        quantity: { $first: '$items.quantity' },
        pricePerUnit: { $first: '$items.pricePerUnit' },
        lastBilledAt: { $first: '$createdAt' },
      },
    },
    { $sort: { lastBilledAt: -1 } },
    { $limit: cap },
  ]);

  return rows.map((row) => {
    const quantity = Number(row.quantity) || 1;
    const price = Number(row.price) || 0;
    const unitPrice = row.pricePerUnit ? price : price / quantity;
    return {
      productName: row.productName,
      unit: row.unit || 'piece',
      unitPrice: Math.round(unitPrice * 100) / 100,
      lastBilledAt: row.lastBilledAt,
    };
  });
};
