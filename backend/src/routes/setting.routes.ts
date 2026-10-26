import { Router } from 'express';
import { SettingController } from '@/controllers/setting.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { updateSettingSchema } from '@/validators/setting.validator';

export const settingRouter = Router();

settingRouter.use(asyncHandler(authenticate));

settingRouter.get(
  '/',
  authorize('settings.read'),
  SettingController.getSettings
);

settingRouter.patch(
  '/',
  authorize('settings.update'),
  validateRequest(updateSettingSchema, 'body'),
  SettingController.updateSettings
);
