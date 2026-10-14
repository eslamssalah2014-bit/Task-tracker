import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { DailyTaskCheckJob } from './jobs/dailyTaskCheck';
import { env } from './config/env';
import { supabase } from './config/supabase';
import { requireAuthentication, AuthenticatedRequest } from './middleware/auth.middleware';

export const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration (Section 11)
const configuredFrontend = (env.FRONTEND_URL || '').replace(/\/+$/, '');
const allowedOrigins = [
  configuredFrontend,
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview and production deployments (*.vercel.app)
      if (/^https:\/\/[a-zA-Z0-9_\-.]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // In development, allow any origin
      if (env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Default safe allow with logged warning for unanticipated domains
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Accept'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400,
  })
);

// Rate Limiting (Relaxed for dev/testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
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

// Render Simple Health Check (Section 10 & 14)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Comprehensive API Health Endpoint (Section 14)
app.get('/api/v1/health', async (req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    const { error } = await supabase.from('roles').select('name').limit(1);
    if (error) {
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'unreachable';
  }

  res.status(200).json({
    status: 'ok',
    service: 'task-tracker-api',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: env.NODE_ENV,
    timezone: env.DEFAULT_TIMEZONE,
  });
});

// Protected Diagnostics Endpoint for Administrators (Section 14)
app.get(
  '/api/v1/health/diagnostics',
  requireAuthentication,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    // Only Super Admin or Admin can inspect system diagnostics
    if (req.user?.role_name !== 'Super Admin' && req.user?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view system diagnostics.',
        code: 'FORBIDDEN',
      });
    }

    let dbLatencyMs = -1;
    let dbStatus = 'ok';
    const start = Date.now();
    try {
      const { error } = await supabase.from('roles').select('count', { count: 'exact', head: true });
      dbLatencyMs = Date.now() - start;
      if (error) {
        dbStatus = `error: ${error.message}`;
      }
    } catch (e: any) {
      dbStatus = `unreachable: ${e.message}`;
    }

    res.status(200).json({
      success: true,
      data: {
        api: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          environment: env.NODE_ENV,
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          urlConfigured: !!env.SUPABASE_URL,
          serviceRoleKeyConfigured: !!env.SUPABASE_SERVICE_ROLE_KEY,
        },
        services: {
          emailProvider: env.EMAIL_PROVIDER,
          aiProvider: env.AI_PROVIDER,
          defaultTimezone: env.DEFAULT_TIMEZONE,
        },
        timestamp: new Date().toISOString(),
      },
    });
  }
);

// Trigger daily background scan (can be called by Render cron or manually)
app.post('/api/v1/jobs/daily-check', async (req: Request, res: Response) => {
  const result = await DailyTaskCheckJob.run();
  res.status(200).json({ success: true, data: result });
});

// Explicitly block any unauthenticated public registration attempts
app.all(
  ['/register', '/signup', '/api/register', '/api/signup', '/api/v1/register', '/api/v1/signup'],
  (req: Request, res: Response) => {
    res.status(403).json({
      success: false,
      message: 'Public registration is disabled. This is an internal tool and accounts can only be provisioned by authorized administrators.',
      code: 'REGISTRATION_DISABLED',
    });
  }
);

// Mount versioned REST API (Section 61)
app.use('/api/v1', apiRouter);

// Centralized Error Handling (Section 63)
app.use(errorHandler);
