import { Router } from 'express';
import { StaffController } from '@/controllers/staff.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createStaffSchema,
  updateStaffSchema,
  staffQuerySchema,
} from '@/validators/staff.validator';

export const staffRouter = Router();

staffRouter.use(asyncHandler(authenticate));

staffRouter.get(
  '/',
  authorize('staff.read'),
  validateRequest(staffQuerySchema, 'query'),
  StaffController.list
);

staffRouter.get(
  '/roles',
  authorize('staff.read'),
  StaffController.getRoles
);

staffRouter.post(
  '/',
  authorize('staff.create'),
  validateRequest(createStaffSchema, 'body'),
  StaffController.create
);

staffRouter.get(
  '/:id',
  authorize('staff.read'),
  validateRequest(idParamSchema, 'params'),
  StaffController.getById
);

staffRouter.patch(
  '/:id',
  authorize('staff.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateStaffSchema, 'body'),
  StaffController.update
);

staffRouter.delete(
  '/:id',
  authorize('staff.delete'),
  validateRequest(idParamSchema, 'params'),
  StaffController.delete
);

staffRouter.patch(
  '/:id/restore',
  authorize('staff.update'),
  validateRequest(idParamSchema, 'params'),
  StaffController.restore
);
