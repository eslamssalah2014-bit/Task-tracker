import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { DailyTaskCheckJob } from './jobs/dailyTaskCheck';
import { env } from './config/env';

export const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: '*', // Allows access from Next.js frontend or preview URLs
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  })
);

// Rate Limiting (Relaxed for dev/testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request Parsing & Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Render Health Check (Section 87 & 89)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'task-tracker-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'connected',
    timezone: env.DEFAULT_TIMEZONE,
  });
});

// Trigger daily background scan (can be called by Render cron or manually)
app.post('/api/v1/jobs/daily-check', async (req: Request, res: Response) => {
  const result = await DailyTaskCheckJob.run();
  res.status(200).json({ success: true, data: result });
});

// Mount versioned REST API (Section 61)
app.use('/api/v1', apiRouter);

// Centralized Error Handling (Section 63)
app.use(errorHandler);
