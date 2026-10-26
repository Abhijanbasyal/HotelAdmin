import { Router, type Request, type Response } from 'express';
import { authRouter } from './auth.routes';
import { auditRouter } from './audit.routes';
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

// ── Future feature routes will be registered here as each phase is implemented ────
// apiRouter.use('/products', productRoutes);
// apiRouter.use('/categories', categoryRoutes);
// apiRouter.use('/tables', tableRoutes);
// apiRouter.use('/bookings', bookingRoutes);
// apiRouter.use('/customers', customerRoutes);
// apiRouter.use('/staff', staffRoutes);
// apiRouter.use('/roles', roleRoutes);
// apiRouter.use('/departments', departmentRoutes);
// apiRouter.use('/assets', assetRoutes);
