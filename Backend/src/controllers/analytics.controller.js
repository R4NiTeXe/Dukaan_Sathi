import {
  monthlyRevenue,
  weeklyRevenue,
  topProducts,
  customerReport,
} from '../services/analytics.service.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'

const monthly = asyncHandler(async (req, res) => {
  const data = await monthlyRevenue(req.user._id)
  return res
    .status(200)
    .json(new ApiResponse(200, { data }, 'Monthly analytics'))
})

const weekly = asyncHandler(async (req, res) => {
  const data = await weeklyRevenue(req.user._id)
  return res
    .status(200)
    .json(new ApiResponse(200, { data }, 'Weekly analytics'))
})

const topProductsHandler = asyncHandler(async (req, res) => {
  const data = await topProducts(req.user._id, req.query.limit)
  return res.status(200).json(new ApiResponse(200, { data }, 'Top products'))
})

const customerReportHandler = asyncHandler(async (req, res) => {
  const data = await customerReport(req.user._id)
  return res.status(200).json(new ApiResponse(200, { data }, 'Customer report'))
})

export {
  monthly,
  weekly,
  topProductsHandler as topProducts,
  customerReportHandler as customerReport,
}
