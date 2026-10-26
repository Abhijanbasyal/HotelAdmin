import { Router } from 'express';
import { ProductController } from '@/controllers/product.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from '@/validators/product.validator';

export const productRouter = Router();

productRouter.use(asyncHandler(authenticate));

// List products
productRouter.get(
  '/',
  authorize('products.read'),
  validateRequest(productQuerySchema, 'query'),
  ProductController.list
);

// Create product
productRouter.post(
  '/',
  authorize('products.create'),
  validateRequest(createProductSchema, 'body'),
  ProductController.create
);

// Get single product
productRouter.get(
  '/:id',
  authorize('products.read'),
  validateRequest(idParamSchema, 'params'),
  ProductController.getById
);

// Update product
productRouter.patch(
  '/:id',
  authorize('products.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateProductSchema, 'body'),
  ProductController.update
);

// Soft delete product
productRouter.delete(
  '/:id',
  authorize('products.delete'),
  validateRequest(idParamSchema, 'params'),
  ProductController.delete
);

// Restore product
productRouter.patch(
  '/:id/restore',
  authorize('products.update'),
  validateRequest(idParamSchema, 'params'),
  ProductController.restore
);
