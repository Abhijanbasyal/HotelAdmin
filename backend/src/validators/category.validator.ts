import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  image: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryParams = z.infer<typeof categoryQuerySchema>;
