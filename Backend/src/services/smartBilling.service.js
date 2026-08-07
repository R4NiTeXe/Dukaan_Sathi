import { Product } from '../models/Product.model.js';
import {
  normalize,
  coreQueryOf,
  buildSearchKeys,
  resolveBestMatch,
  scoreMatch,
} from '../helpers/smartMatch.helper.js';

const CACHE_TTL_MS = 30 * 1000;

// In-memory catalog cache per user. Shops keep their catalog small (tens to a
// few thousand items), so holding the normalized search keys in memory and
// matching with a scored fuzzy pass is dramatically faster than a Mongo $regex
// scan — and still consistent thanks to the short TTL + explicit invalidation.
const catalogCache = new Map(); // userId -> { expires, entries: [] }

const toCatalogEntry = (product) => ({
  id: product._id.toString(),
  name: product.name,
  normalizedName: normalize(product.name),
  normalizedAliases: (product.aliases || []).map((alias) => normalize(alias)),
  searchKeys: product.searchKeys || buildSearchKeys(product.name, product.aliases),
  price: Number(product.price) || 0,
  unit: product.unit || 'piece',
  category: product.category || 'other',
  taxRate: Number(product.taxRate) || 0,
  autoAdded: product.autoAdded === true,
});

export const invalidateCatalogCache = (userId) => {
  if (userId) catalogCache.delete(String(userId));
};

export const getUserCatalog = async (userId) => {
  const key = String(userId);
  const cached = catalogCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.entries;

  const products = await Product.find(
    { userId },
    'name price unit category taxRate aliases searchKeys autoAdded'
  )
    .lean()
    .limit(5000);
  const entries = products.map(toCatalogEntry);
  catalogCache.set(key, { expires: Date.now() + CACHE_TTL_MS, entries });
  return entries;
};

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

// Enrich extracted items with the shop's saved product data. Purely additive:
// the original Gemini fields are always preserved so the existing UI keeps
// working even for shops with an empty catalog.
export const matchCatalogItems = async ({ userId, items }) => {
  const catalog = await getUserCatalog(userId);
  if (catalog.length === 0) {
    return (items || []).map((item) => ({ ...item, match: 'new' }));
  }

  return (items || []).map((item) => {
    const base = { ...item };

    const result = resolveBestMatch(item.productName, catalog);
    if (!result) {
      return { ...base, match: 'new' };
    }

    if (result.ambiguous) {
      return {
        ...base,
        match: 'ambiguous',
        candidates: result.candidates.map(({ product, score, via }) => ({
          _id: product.id,
          name: product.name,
          price: roundMoney(product.price),
          unit: product.unit,
          via,
          score,
        })),
      };
    }

    const { product, via } = result;
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(product.price) || 0;

    // Catalog price is authoritative — but only when the owner actually set one.
    // Otherwise fall back to whatever Gemini heard.
    const useCatalogPrice = unitPrice > 0;
    const spokenPrice = Number(item.price) || 0;

    return {
      ...base,
      match: 'catalog',
      via,
      matchedProductId: product.id,
      productName: product.name,
      catalogName: product.name,
      catalogUnit: product.unit,
      catalogUnitPrice: useCatalogPrice ? roundMoney(unitPrice) : undefined,
      category: product.category,
      taxRate: product.taxRate,
      spokenPrice: spokenPrice > 0 ? spokenPrice : undefined,
      unit: product.unit || item.unit || 'piece',
      // price is the line total (qty × unit), matching the billing table's
      // existing convention so qty edits auto-scale correctly in the UI.
      price: useCatalogPrice ? roundMoney(unitPrice * quantity) : spokenPrice,
      pricePerUnit: false,
    };
  });
};

// Auto-suggest products while typing. Prefix matches win, then substring and
// fuzzy (typo) matches, across names, aliases and transliterations.
export const suggestProducts = async ({ userId, query, limit = 8 }) => {
  const q = normalize(query);
  if (!q) return [];

  const catalog = await getUserCatalog(userId);

  // Natural-language support ("one kilo sugar", "2 Maggi"). The core phrase
  // (quantity/unit words stripped) is what gets scored against product names.
  const coreQuery = coreQueryOf(query);

  const scored = [];
  for (const entry of catalog) {
    let score = Math.max(scoreMatch(q, entry.normalizedName), scoreMatch(coreQuery, entry.normalizedName));
    let via = 'name';
    for (const alias of entry.normalizedAliases || []) {
      const aliasScore = Math.max(scoreMatch(q, alias), scoreMatch(coreQuery, alias));
      if (aliasScore > score) {
        score = aliasScore;
        via = 'alias';
      }
    }
    for (const key of entry.searchKeys || []) {
      if (key === q || key === coreQuery) {
        score = Math.max(score, 100);
        via = 'key';
      }
    }
    if (score >= 40) {
      scored.push({
        _id: entry.id,
        name: entry.name,
        price: entry.price,
        unit: entry.unit,
        category: entry.category,
        taxRate: entry.taxRate,
        matchType: via,
        score,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, Number(limit) || 8);
};

// Instant learning: after the cashier confirms a price for a new item, create
// the catalog entry permanently. Case-insensitive + alias aware, so the same
// spoken name is never learned twice.
export const learnItem = async ({ userId, item }) => {
  const name = String(item.productName || '').trim();
  if (!name) return null;

  const normalized = normalize(name);
  const catalog = await getUserCatalog(userId);
  const existing = catalog.find(
    (entry) =>
      entry.normalizedName === normalized ||
      entry.searchKeys.includes(normalized) ||
      (entry.normalizedAliases || []).includes(normalized)
  );
  if (existing) return null;

  const quantity = Number(item.quantity) || 1;
  const unitPrice =
    item.pricePerUnit === true
      ? Number(item.price) || 0
      : quantity > 0
        ? (Number(item.price) || 0) / quantity
        : Number(item.price) || 0;
  if (unitPrice <= 0) return null;

  try {
    const product = await Product.create({
      userId,
      name,
      price: roundMoney(unitPrice),
      unit: String(item.unit || 'piece').trim(),
      category: String(item.category || 'other').trim(),
      taxRate: Math.max(0, Number(item.taxRate) || 0),
      aliases: [],
      autoAdded: true,
    });
    invalidateCatalogCache(userId);
    return product;
  } catch (error) {
    if (error?.code === 11000) return null; // raced with a concurrent learn
    throw error;
  }
};

// Bulk entry point used by the billing save flow. Returns the created products.
export const learnItems = async ({ userId, items }) => {
  const created = [];
  for (const item of items || []) {
    const product = await learnItem({ userId, item });
    if (product) created.push(product);
  }
  return created;
};