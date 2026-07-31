import { Bill } from '../models/Bill.model.js'
import { Product } from '../models/Product.model.js'
import { Customer } from '../models/Customer.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

const searchAll = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim()
  if (!q) {
    throw new ApiError(400, 'Search query is required')
  }

  const regex = { $regex: q, $options: 'i' }

  const [bills, products, customers] = await Promise.all([
    Bill.find({
      userId: req.user._id,
      $or: [{ billNumber: regex }, { 'items.productName': regex }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('billNumber totalAmount paymentMethod paymentStatus createdAt')
      .lean(),
    Product.find({
      userId: req.user._id,
      $or: [{ name: regex }, { category: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category price unit')
      .lean(),
    Customer.find({
      userId: req.user._id,
      $or: [{ name: regex }, { phone: regex }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phone totalPurchases')
      .lean(),
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bills, products, customers },
        `Search results for "${q}"`
      )
    )
})

export { searchAll }
