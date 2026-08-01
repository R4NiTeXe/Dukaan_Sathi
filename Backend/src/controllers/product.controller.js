import mongoose from 'mongoose'
import { Product } from '../models/Product.model.js'
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

const createProduct = asyncHandler(async (req, res) => {
  const validated = createProductSchema.parse(req.body)

  const product = await Product.create({ ...validated, userId: req.user._id })

  return res
    .status(201)
    .json(new ApiResponse(201, { product }, 'Product created'))
})

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)
  const search = req.query.search?.trim()

  const filter = { userId: req.user._id }
  if (search) {
    filter.name = { $regex: search, $options: 'i' }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name price unit stock')
      .lean(),
    Product.countDocuments(filter),
  ])

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  )
})

const getProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid product id')
  }

  const product = await Product.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).lean()
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  return res.status(200).json(new ApiResponse(200, { product }))
})

const updateProduct = asyncHandler(async (req, res) => {
  const validated = updateProductSchema.parse(req.body)

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: validated },
    { new: true, runValidators: true }
  ).lean()
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { product }, 'Product updated'))
})

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  }).lean()
  if (!product) {
    throw new ApiError(404, 'Product not found')
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { deletedProductId: product._id }, 'Product deleted')
    )
})

export { createProduct, listProducts, getProduct, updateProduct, deleteProduct }
