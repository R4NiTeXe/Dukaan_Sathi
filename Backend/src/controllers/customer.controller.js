import { Customer } from '../models/Customer.model.js'
import { generateCustomerNumber } from '../helpers/customerNumber.helper.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

const createCustomer = asyncHandler(async (req, res) => {
  const customerNumber = await generateCustomerNumber(req.user._id)
  const customer = await Customer.create({
    customerNumber,
    userId: req.user._id,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, { customer }, 'Customer created'))
})

const listCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50)
  const search = req.query.search?.trim()

  const filter = { userId: req.user._id }
  if (search) {
    filter.customerNumber = { $regex: search, $options: 'i' }
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('customerNumber totalPurchases createdAt')
      .lean(),
    Customer.countDocuments(filter),
  ])

  return res.status(200).json(
    new ApiResponse(200, {
      customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  )
})

export { createCustomer, listCustomers }
