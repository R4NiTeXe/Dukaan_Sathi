import { User } from '../models/User.model.js';
import { registerSchema, loginSchema, updateProfileSchema, refreshSchema } from '../validators/auth.validator.js';
import { uploadQRCode } from '../services/cloudinary.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: '/api/auth/refresh',
};

const register = asyncHandler(async (req, res) => {
  const validated = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email: validated.email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create(validated);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.setRefreshToken(refreshToken);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: { _id: user._id, ownerName: user.ownerName, email: user.email, shopName: user.shopName },
        accessToken,
      },
      'Registration successful'
    )
  );
});

const login = asyncHandler(async (req, res) => {
  const validated = loginSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordCorrect = await user.isPasswordCorrect(validated.password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.setRefreshToken(refreshToken);

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: { _id: user._id, ownerName: user.ownerName, email: user.email, shopName: user.shopName },
        accessToken,
      },
      'Login successful'
    )
  );
});

const getProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, { user: req.user }, 'Profile fetched'));
});

const updateProfile = asyncHandler(async (req, res) => {
  let updates = {};

  if (req.file) {
    const url = await uploadQRCode(req.file);
    updates.upiQrCode = url;
  }

  if (req.body && Object.keys(req.body).length > 0) {
    const validated = updateProfileSchema.parse(req.body);
    updates = { ...validated, ...updates };
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'At least one field or a QR image must be provided');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');

  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  let decoded;
  try {
    const jwt = await import('jsonwebtoken');
    decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded._id);
  if (!user || !user.refreshToken) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const isValid = await user.verifyRefreshToken(refreshToken);
  if (!isValid) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();
  await user.setRefreshToken(newRefreshToken);

  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

  return res.status(200).json(
    new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed')
  );
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    let decoded;
    try {
      const jwt = await import('jsonwebtoken');
      decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      decoded = null;
    }
    if (decoded?._id) {
      const user = await User.findById(decoded._id);
      if (user?.refreshToken) {
        await user.clearRefreshToken();
      }
    }
  }
  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res.status(200).json(new ApiResponse(200, null, 'Logged out'));
});

export { register, login, getProfile, updateProfile, refresh, logout };
