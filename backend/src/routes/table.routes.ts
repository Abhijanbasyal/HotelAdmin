import { Router } from 'express';
import { TableController } from '@/controllers/table.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createTableSchema,
  updateTableSchema,
  tableQuerySchema,
} from '@/validators/table.validator';

export const tableRouter = Router();

tableRouter.use(asyncHandler(authenticate));

tableRouter.get(
  '/',
  authorize('tables.read'),
  validateRequest(tableQuerySchema, 'query'),
  TableController.list
);

tableRouter.get(
  '/active',
  authorize('tables.read'),
  TableController.getActive
);

tableRouter.post(
  '/',
  authorize('tables.create'),
  validateRequest(createTableSchema, 'body'),
  TableController.create
);

tableRouter.get(
  '/:id',
  authorize('tables.read'),
  validateRequest(idParamSchema, 'params'),
  TableController.getById
);

tableRouter.patch(
  '/:id',
  authorize('tables.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateTableSchema, 'body'),
  TableController.update
);

tableRouter.delete(
  '/:id',
  authorize('tables.delete'),
  validateRequest(idParamSchema, 'params'),
  TableController.delete
);

tableRouter.patch(
  '/:id/restore',
  authorize('tables.update'),
  validateRequest(idParamSchema, 'params'),
  TableController.restore
);
