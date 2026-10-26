import { Router } from 'express';
import { CustomerController } from '@/controllers/customer.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
} from '@/validators/customer.validator';

export const customerRouter = Router();

customerRouter.use(asyncHandler(authenticate));

customerRouter.get(
  '/',
  authorize('customers.read'),
  validateRequest(customerQuerySchema, 'query'),
  CustomerController.list
);

customerRouter.post(
  '/',
  authorize('customers.create'),
  validateRequest(createCustomerSchema, 'body'),
  CustomerController.create
);

customerRouter.get(
  '/:id',
  authorize('customers.read'),
  validateRequest(idParamSchema, 'params'),
  CustomerController.getById
);

customerRouter.patch(
  '/:id',
  authorize('customers.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateCustomerSchema, 'body'),
  CustomerController.update
);

customerRouter.delete(
  '/:id',
  authorize('customers.delete'),
  validateRequest(idParamSchema, 'params'),
  CustomerController.delete
);

customerRouter.patch(
  '/:id/restore',
  authorize('customers.update'),
  validateRequest(idParamSchema, 'params'),
  CustomerController.restore
);
