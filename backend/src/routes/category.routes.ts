import { Router } from 'express';
import { CategoryController } from '@/controllers/category.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from '@/validators/category.validator';

export const categoryRouter = Router();

categoryRouter.use(asyncHandler(authenticate));

// List categories
categoryRouter.get(
  '/',
  authorize('categories.read'),
  validateRequest(categoryQuerySchema, 'query'),
  CategoryController.list
);

// Lightweight list of active categories for product form selectors
categoryRouter.get(
  '/active',
  CategoryController.getActive
);

// Create category
categoryRouter.post(
  '/',
  authorize('categories.create'),
  validateRequest(createCategorySchema, 'body'),
  CategoryController.create
);

// Get single category
categoryRouter.get(
  '/:id',
  authorize('categories.read'),
  validateRequest(idParamSchema, 'params'),
  CategoryController.getById
);

// Update category
categoryRouter.patch(
  '/:id',
  authorize('categories.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateCategorySchema, 'body'),
  CategoryController.update
);

// Soft delete category
categoryRouter.delete(
  '/:id',
  authorize('categories.delete'),
  validateRequest(idParamSchema, 'params'),
  CategoryController.delete
);

// Restore category
categoryRouter.patch(
  '/:id/restore',
  authorize('categories.update'),
  validateRequest(idParamSchema, 'params'),
  CategoryController.restore
);
