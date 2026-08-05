import { dashboardSummary } from '../services/analytics.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const summary = asyncHandler(async (req, res) => {
  const data = await dashboardSummary(req.user._id);
  return res.status(200).json(new ApiResponse(200, data, 'Dashboard summary'));
});

export { summary };
