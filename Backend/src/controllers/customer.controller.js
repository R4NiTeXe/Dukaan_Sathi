import mongoose from 'mongoose'
import { Customer } from '../models/Customer.model.js'
import { generateCustomerNumber } from '../helpers/customerNumber.helper.js'
import ApiError from '../utils/ApiError.js'
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

const getCustomer = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid customer id')
  }

  const customer = await Customer.findOne({
    _id: req.params.id,
    userId: req.user._id,
  })
    .select('customerNumber totalPurchases createdAt')
    .lean()
  if (!customer) {
    throw new ApiError(404, 'Customer not found')
  }

  return res.status(200).json(new ApiResponse(200, { customer }))
})

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  }).lean()
  if (!customer) {
    throw new ApiError(404, 'Customer not found')
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deletedCustomerId: customer._id },
        'Customer deleted'
      )
    )
})

export { createCustomer, listCustomers, getCustomer, deleteCustomer }
