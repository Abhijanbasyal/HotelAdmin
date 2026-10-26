import { Router } from 'express';
import { DashboardController } from '@/controllers/dashboard.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { asyncHandler } from '@/utils/asyncHandler';

export const dashboardRouter = Router();

dashboardRouter.use(asyncHandler(authenticate));

dashboardRouter.get(
  '/summary',
  authorize('dashboard.read'),
  DashboardController.getSummary
);

dashboardRouter.get(
  '/trends',
  authorize('dashboard.read'),
  DashboardController.getBookingTrends
);

dashboardRouter.get(
  '/occupancy',
  authorize('dashboard.read'),
  DashboardController.getTableOccupancy
);

dashboardRouter.get(
  '/recent',
  authorize('dashboard.read'),
  DashboardController.getRecentActivity
);
