import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.route.js';
import billingRoutes from './routes/billing.route.js';
import customerRoutes from './routes/customers.route.js';
import productRoutes from './routes/products.route.js';
import billRoutes from './routes/bills.route.js';
import dashboardRoutes from './routes/dashboard.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import searchRoutes from './routes/search.route.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(limiter);

app.get('/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbState,
    memory: process.memoryUsage(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);

app.get('/', (req, res) => {
  res.send('AI Billing API is running');
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
