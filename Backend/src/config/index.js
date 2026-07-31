import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const env = process.env;

const server = {
  port: parseInt(env.PORT, 10) || 8000,
  nodeEnv: env.NODE_ENV || 'development',
  version: pkg.version,
  isProduction: (env.NODE_ENV || 'development') === 'production',
};

const db = {
  uri: env.MONGODB_URI,
  name: env.DB_NAME || 'ai-billing',
};

const jwt = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET,
  expiry: env.JWT_EXPIRY || '7d',
  refreshExpiry: env.JWT_REFRESH_EXPIRY || '30d',
};

const gemini = {
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_MODEL || 'gemini-flash-latest',
};

const cloudinary = {
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
};

const cookie = {
  name: 'refreshToken',
  httpOnly: true,
  secure: server.isProduction,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

const rateLimit = {
  max: parseInt(env.RATE_LIMIT_MAX, 10) || 300,
  windowMs: 15 * 60 * 1000,
};

const cors = {
  origins: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : true,
};

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key] || !env[key].trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Add them to the .env file (see .env.example) or the hosting platform.'
    );
  }
  if (env.JWT_SECRET && env.JWT_SECRET.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long');
  }
  if (env.PORT && Number.isNaN(parseInt(env.PORT, 10))) {
    throw new Error('PORT must be a valid number');
  }
};

export default {
  server,
  db,
  jwt,
  gemini,
  cloudinary,
  cookie,
  rateLimit,
  cors,
  validateEnv,
};