import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import { env } from '@/config/env';
import { corsOptions } from '@/config/cors';
import { helmetOptions, globalRateLimitOptions } from '@/config/security';
import { requestLogger } from '@/middleware/requestLogger';
import { errorHandler } from '@/middleware/errorHandler';
import { apiRouter } from '@/routes';

import { asyncHandler } from '@/utils/asyncHandler';

export function createApp(): Application {
  const app = express();

  // ── Trust proxy (for rate limiting behind nginx, etc.) ─────────────────────
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet(helmetOptions));

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Pre-flight

  // ── Body parsing ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Cookie parsing ─────────────────────────────────────────────────────────
  app.use(cookieParser(env.COOKIE_SECRET));

  // ── Response compression ───────────────────────────────────────────────────
  app.use(compression());

  // ── Global rate limiter ────────────────────────────────────────────────────
  app.use(rateLimit(globalRateLimitOptions));

  // ── HTTP request logger ────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Health check (bypass auth + rate limit) ────────────────────────────────
  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const { getDatabaseHealth } = await import('@/config/database');
      const dbHealth = await getDatabaseHealth();
      const isHealthy = dbHealth.status === 'connected';

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: env.API_VERSION,
        environment: env.NODE_ENV,
        database: dbHealth,
      });
    })
  );

  // ── API routes ─────────────────────────────────────────────────────────────
  app.use(`/api/${env.API_VERSION}`, apiRouter);

  // ── 404 handler ────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'The requested endpoint does not exist.',
      code: 'NOT_FOUND',
    });
  });

  // ── Centralized error handler (must be last) ───────────────────────────────
  app.use(errorHandler);

  return app;
}
