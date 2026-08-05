import mongoose from 'mongoose';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';
import { logError } from '../utils/logger.js';

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error instanceof mongoose.Error.ValidationError) {
    error = new ApiError(
      400,
      error.message,
      Object.values(error.errors).map((e) => e.message)
    );
  } else if (error instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid value for ${error.path}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    error = new ApiError(409, `Duplicate value for ${field}`);
  } else if (
    error.name === 'MongoServerError' ||
    error.name === 'MongoServerSelectionError' ||
    error.name === 'MongoNetworkError' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT'
  ) {
    error = new ApiError(503, 'Service temporarily unavailable, please try again');
  } else if (error.name === 'ZodError') {
    error = new ApiError(400, error.errors[0].message, error.errors);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Unauthorized: Invalid or expired token');
  } else if (error instanceof multer.MulterError) {
    error = new ApiError(400, error.message);
  } else if (error.type === 'entity.too.large') {
    error = new ApiError(413, 'Request payload too large');
  } else if (!(error instanceof ApiError)) {
    error = new ApiError(500, error.message || 'Internal server error');
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
  };
  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }
  if (config.server.nodeEnv === 'development' && error.statusCode >= 500) {
    response.stack = error.stack;
  }

  if (error.statusCode >= 500) {
    logError(error.message, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: error.statusCode,
      stack: error.stack,
    });
  }

  return res.status(error.statusCode).json(response);
};

export { notFoundHandler, errorHandler };
