import { Router } from 'express';
import { RoleController } from '@/controllers/role.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createRoleSchema,
  updateRoleSchema,
  roleQuerySchema,
} from '@/validators/role.validator';

export const roleRouter = Router();

roleRouter.use(asyncHandler(authenticate));

roleRouter.get(
  '/permissions',
  authorize('roles.read'),
  RoleController.getPermissionsList
);

roleRouter.get(
  '/active',
  authorize('roles.read'),
  RoleController.getActive
);

roleRouter.get(
  '/',
  authorize('roles.read'),
  validateRequest(roleQuerySchema, 'query'),
  RoleController.list
);

roleRouter.post(
  '/',
  authorize('roles.create'),
  validateRequest(createRoleSchema, 'body'),
  RoleController.create
);

roleRouter.get(
  '/:id',
  authorize('roles.read'),
  validateRequest(idParamSchema, 'params'),
  RoleController.getById
);

roleRouter.patch(
  '/:id',
  authorize('roles.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateRoleSchema, 'body'),
  RoleController.update
);

roleRouter.delete(
  '/:id',
  authorize('roles.delete'),
  validateRequest(idParamSchema, 'params'),
  RoleController.delete
);

roleRouter.patch(
  '/:id/restore',
  authorize('roles.update'),
  validateRequest(idParamSchema, 'params'),
  RoleController.restore
);
