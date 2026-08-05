import { Product } from '../models/Product.model.js';
import { Bill } from '../models/Bill.model.js';
import config from '../config/index.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalize = (value) => (value || '').trim().toLowerCase();

export const salesWindowSince = () => {
  const days = config.productAutoAdd.windowDays;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const buildCounts = (bills) => {
  const counts = new Map();
  for (const bill of bills) {
    const billAt = new Date(bill.createdAt).getTime();
    for (const item of bill.items) {
      const key = normalize(item.productName);
      if (!key) continue;

      let entry = counts.get(key);
      if (!entry) {
        entry = {
          name: item.productName.trim(),
          count: 0,
          qty: 0,
          lastPrice: item.price || 0,
          lastQty: item.quantity || 0,
          lastPricePerUnit: item.pricePerUnit === true,
          lastUnit: item.unit || 'piece',
          lastAt: billAt,
        };
        counts.set(key, entry);
      }

      entry.count += 1;
      entry.qty += item.quantity || 0;
      if (billAt >= entry.lastAt) {
        entry.lastAt = billAt;
        entry.lastPrice = item.price || 0;
        entry.lastQty = item.quantity || 0;
        entry.lastPricePerUnit = item.pricePerUnit === true;
        entry.lastUnit = item.unit || 'piece';
      }
    }
  }
  return counts;
};

// Times sold + quantity per item name within the trailing window (case-insensitive).
export const monthlySalesCounts = async (userId) => {
  const bills = await Bill.find(
    { userId, createdAt: { $gte: salesWindowSince() } },
    { items: 1, createdAt: 1 }
  ).lean();
  return buildCounts(bills);
};

// After a bill is saved: auto-create products that crossed the sales
// threshold this month and are not yet in the catalog (case-insensitive match).
export const autoAddProducts = async (userId, items) => {
  const added = [];
  const names = [...new Set((items || []).map((item) => item.productName).filter(Boolean))];
  if (names.length === 0) return added;

  const existing = await Product.find({
    userId,
    name: {
      $in: names.map((name) => new RegExp(`^${escapeRegex(name.trim())}$`, 'i')),
    },
  })
    .select('name')
    .lean();
  const existingKeys = new Set(existing.map((product) => normalize(product.name)));

  const missing = (items || []).filter((item) => !existingKeys.has(normalize(item.productName)));
  if (missing.length === 0) return added;

  const counts = await monthlySalesCounts(userId);
  const threshold = config.productAutoAdd.threshold;

  for (const item of missing) {
    const entry = counts.get(normalize(item.productName));
    if (!entry || entry.count <= threshold) continue;

    const unitPrice = entry.lastPricePerUnit
      ? entry.lastPrice
      : entry.lastQty > 0
        ? entry.lastPrice / entry.lastQty
        : entry.lastPrice;

    const product = await Product.create({
      userId,
      name: entry.name,
      price: Math.round(unitPrice * 100) / 100,
      unit: entry.lastUnit,
      autoAdded: true,
    });
    added.push(product);
  }

  return added;
};
