import mongoose from 'mongoose';
import { Product } from '../models/Product.model.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { monthlySalesCounts } from '../helpers/productAutoAdd.helper.js';
import { buildSearchKeys } from '../helpers/smartMatch.helper.js';
import {
  suggestProducts,
  invalidateCatalogCache,
} from '../services/smartBilling.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const PRODUCT_SELECT = 'name price unit stock category taxRate aliases autoAdded';

const createProduct = asyncHandler(async (req, res) => {
  const validated = createProductSchema.parse(req.body);

  const product = await Product.create({ ...validated, userId: req.user._id });
  invalidateCatalogCache(req.user._id);

  return res.status(201).json(new ApiResponse(201, { product }, 'Product created'));
});

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const search = req.query.search?.trim();

  const filter = { userId: req.user._id };
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const counts = await monthlySalesCounts(req.user._id);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(PRODUCT_SELECT)
      .lean()
      .then((list) =>
        list.map((product) => {
          const entry = counts.get(product.name.trim().toLowerCase());
          return {
            ...product,
            monthlySold: entry?.count || 0,
            monthlyQuantity: entry?.qty || 0,
          };
        })
      ),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  );
});

// Typo-tolerant auto-suggest for the Smart Billing UI.
const searchProducts = asyncHandler(async (req, res) => {
  const query = (req.query.q || '').trim().slice(0, 100);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 25);
  if (!query) {
    return res.status(200).json(new ApiResponse(200, { results: [] }, 'No query provided'));
  }

  const results = await suggestProducts({ userId: req.user._id, query, limit });
  return res.status(200).json(new ApiResponse(200, { results }, 'Suggestions fetched'));
});

const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product id');
  }

  const validated = updateProductSchema.parse(req.body);

  // findOneAndUpdate bypasses the schema pre('save') hook, so rebuild the
  // normalized search keys whenever the name or aliases change.
  if (validated.name !== undefined || validated.aliases !== undefined) {
    const current = await Product.findOne({ _id: productId, userId: req.user._id })
      .select('name aliases')
      .lean();
    if (!current) {
      throw new ApiError(404, 'Product not found');
    }
    const name = validated.name ?? current.name;
    const aliases = validated.aliases ?? current.aliases;
    validated.searchKeys = buildSearchKeys(name, aliases);
  }

  const product = await Product.findOneAndUpdate(
    { _id: productId, userId: req.user._id },
    { $set: validated },
    { new: true, runValidators: true }
  ).select(PRODUCT_SELECT);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  invalidateCatalogCache(req.user._id);
  return res.status(200).json(new ApiResponse(200, { product }, 'Product updated'));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'Invalid product id');
  }

  const product = await Product.findOneAndDelete({
    _id: productId,
    userId: req.user._id,
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  invalidateCatalogCache(req.user._id);
  return res.status(200).json(new ApiResponse(200, null, 'Product deleted'));
});

export {
  createProduct,
  listProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
};