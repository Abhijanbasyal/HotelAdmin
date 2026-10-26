import type { Request, Response } from 'express';
import { SettingService } from '@/services/setting.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { UpdateSettingInput } from '@/validators/setting.validator';

export class SettingController {
  static getSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await SettingService.getSettings();
    return ApiResponse.success(res, settings, 'Settings retrieved successfully');
  });

  static updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateSettingInput;
    const settings = await SettingService.updateSettings(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });
    return ApiResponse.success(res, settings, 'Settings updated successfully');
  });
}
