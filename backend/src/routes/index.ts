import { Router, type Request, type Response } from 'express';
import { authRouter } from './auth.routes';
import { auditRouter } from './audit.routes';
import { assetRouter } from './asset.routes';
import { categoryRouter } from './category.routes';
import { productRouter } from './product.routes';
import { customerRouter } from './customer.routes';
import { staffRouter } from './staff.routes';
import { departmentRouter } from './department.routes';
import { tableRouter } from './table.routes';
import { bookingRouter } from './booking.routes';
import { getDatabaseHealth } from '@/config/database';
import { env } from '@/config/env';

import { asyncHandler } from '@/utils/asyncHandler';

export const apiRouter = Router();

// ── Health & System status ──────────────────────────────────────────────────
apiRouter.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbHealth = await getDatabaseHealth();
    const isHealthy = dbHealth.status === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      version: env.API_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: dbHealth,
    });
  })
);

// ── Root info ───────────────────────────────────────────────────────────────
apiRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Hotel Management API',
    version: env.API_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// ── Authentication & Authorization (Phase 2) ──────────────────────────────
apiRouter.use('/auth', authRouter);

// ── Audit Logs (Phase 3) ───────────────────────────────────────────────────
apiRouter.use('/audit-logs', auditRouter);

// ── Asset Management (Phase 4) ─────────────────────────────────────────────
apiRouter.use('/assets', assetRouter);

// ── Categories & Products (Phase 5) ────────────────────────────────────────
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/products', productRouter);

// ── Customers, Staff & Departments (Phase 6) ───────────────────────────────
apiRouter.use('/customers', customerRouter);
apiRouter.use('/staff', staffRouter);
apiRouter.use('/departments', departmentRouter);

// ── Tables & Bookings (Phase 7) ────────────────────────────────────────────
apiRouter.use('/tables', tableRouter);
apiRouter.use('/bookings', bookingRouter);
