import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.headers.authorization?.startsWith('Bearer ') &&
    req.headers.authorization.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Unauthorized: No token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(401, 'Unauthorized: Invalid or expired token');
  }

  const user = await User.findById(decoded._id).select('-password');

  if (!user) {
    throw new ApiError(401, 'Unauthorized: Invalid token');
  }

  req.user = user;
  next();
});
