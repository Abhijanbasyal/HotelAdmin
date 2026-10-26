import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from './common.validator';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(150, 'Product name cannot exceed 150 characters'),
  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .toUpperCase()
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU cannot exceed 50 characters'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional(),
  price: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseFloat(val)))
    .refine((val) => !isNaN(val) && val >= 0, { message: 'Price must be a non-negative number' }),
  costPrice: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const num = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(num) ? undefined : num;
    }),
  stockQuantity: z
    .union([z.number(), z.string()])
    .default(0)
    .transform((val) => {
      const num = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(num) || num < 0 ? 0 : num;
    }),
  category: objectIdSchema,
  images: z.array(z.string().trim()).optional().default([]),
  isAvailable: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    })
    .default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = paginationQuerySchema.extend({
  category: objectIdSchema.optional(),
  isAvailable: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    }),
  minPrice: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const parsed = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    }),
  maxPrice: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const parsed = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    }),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'low_stock']).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;
