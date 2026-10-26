import { Router } from 'express';
import { DepartmentController } from '@/controllers/department.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema,
} from '@/validators/department.validator';

export const departmentRouter = Router();

departmentRouter.use(asyncHandler(authenticate));

departmentRouter.get(
  '/',
  authorize('departments.read'),
  validateRequest(departmentQuerySchema, 'query'),
  DepartmentController.list
);

departmentRouter.get(
  '/active',
  DepartmentController.getActive
);

departmentRouter.post(
  '/',
  authorize('departments.create'),
  validateRequest(createDepartmentSchema, 'body'),
  DepartmentController.create
);

departmentRouter.get(
  '/:id',
  authorize('departments.read'),
  validateRequest(idParamSchema, 'params'),
  DepartmentController.getById
);

departmentRouter.patch(
  '/:id',
  authorize('departments.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateDepartmentSchema, 'body'),
  DepartmentController.update
);

departmentRouter.delete(
  '/:id',
  authorize('departments.delete'),
  validateRequest(idParamSchema, 'params'),
  DepartmentController.delete
);

departmentRouter.patch(
  '/:id/restore',
  authorize('departments.update'),
  validateRequest(idParamSchema, 'params'),
  DepartmentController.restore
);
