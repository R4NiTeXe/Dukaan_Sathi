import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import { notFoundHandler, errorHandler } from './middlewares/error.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);

app.get('/', (req, res) => {
  res.send('AI Billing API is running');
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
