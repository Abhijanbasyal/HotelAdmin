import type { Request, Response } from 'express';
import { DashboardService } from '@/services/dashboard.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

export class DashboardController {
  static getSummary = asyncHandler(async (_req: Request, res: Response) => {
    const summary = await DashboardService.getSummary();
    return ApiResponse.success(res, summary, 'Dashboard summary retrieved successfully');
  });

  static getBookingTrends = asyncHandler(async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const trends = await DashboardService.getBookingTrends(Number.isFinite(days) ? days : 7);
    return ApiResponse.success(res, trends, 'Booking trends retrieved successfully');
  });

  static getTableOccupancy = asyncHandler(async (_req: Request, res: Response) => {
    const occupancy = await DashboardService.getTableOccupancy();
    return ApiResponse.success(res, occupancy, 'Table occupancy stats retrieved successfully');
  });

  static getRecentActivity = asyncHandler(async (_req: Request, res: Response) => {
    const activity = await DashboardService.getRecentActivity();
    return ApiResponse.success(res, activity, 'Recent activity retrieved successfully');
  });
}
