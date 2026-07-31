import express from 'express'
import compression from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import './db/slowQuery.js'
import { getSlowQueries } from './db/slowQuery.js'
import config from './config/index.js'
import authRoutes from './routes/auth.route.js'
import billingRoutes from './routes/billing.route.js'
import customerRoutes from './routes/customers.route.js'
import productRoutes from './routes/products.route.js'
import billRoutes from './routes/bills.route.js'
import dashboardRoutes from './routes/dashboard.route.js'
import analyticsRoutes from './routes/analytics.route.js'
import searchRoutes from './routes/search.route.js'
import assistantRoutes from './routes/assistant.route.js'
import {
  notFoundHandler,
  errorHandler,
} from './middlewares/error.middleware.js'
import requestId from './middlewares/requestId.middleware.js'
import {
  metricsMiddleware,
  getMetrics,
} from './middlewares/metrics.middleware.js'
import { accessLogger } from './utils/logger.js'
import { pingGemini } from './services/gemini.service.js'
import { pingCloudinary } from './services/cloudinary.service.js'

const app = express()

app.use(requestId)
app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(metricsMiddleware)
app.use(accessLogger)

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
})
app.use(limiter)

app.get('/health', async (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState
  ]
  const [geminiOk, cloudinaryOk] = await Promise.all([
    pingGemini(),
    pingCloudinary(),
  ])

  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.server.version,
    nodeVersion: process.version,
    uptime: process.uptime(),
    database: dbState,
    services: {
      gemini: geminiOk ? 'ok' : 'error',
      cloudinary: cloudinaryOk ? 'ok' : 'error',
    },
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
    slowQueries: getSlowQueries(),
  }

  if (dbState !== 'connected') {
    response.status = 'degraded'
    return res.status(503).json(response)
  }
  return res.json(response)
})

app.get('/metrics', (req, res) => {
  res.json(getMetrics())
})

const API_PREFIX = '/api/v1'

app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/billing`, billingRoutes)
app.use(`${API_PREFIX}/customers`, customerRoutes)
app.use(`${API_PREFIX}/products`, productRoutes)
app.use(`${API_PREFIX}/bills`, billRoutes)
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes)
app.use(`${API_PREFIX}/analytics`, analyticsRoutes)
app.use(`${API_PREFIX}/search`, searchRoutes)
app.use(`${API_PREFIX}/assistant`, assistantRoutes)

app.get('/', (req, res) => {
  res.send('AI Billing API is running')
})

app.use(notFoundHandler)
app.use(errorHandler)

export default app
