import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const tableStatusEnum = z.enum(['available', 'occupied', 'reserved', 'maintenance']);

export const createTableSchema = z.object({
  tableNumber: z
    .string({ required_error: 'Table number is required' })
    .trim()
    .toUpperCase()
    .min(1, 'Table number must be at least 1 character')
    .max(20, 'Table number cannot exceed 20 characters'),
  capacity: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'Capacity must be between 1 and 50 guests',
    }),
  location: z
    .string({ required_error: 'Location / zone is required' })
    .trim()
    .min(1, 'Location cannot be empty')
    .max(100, 'Location cannot exceed 100 characters')
    .default('Main Dining Room'),
  status: tableStatusEnum.default('available'),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const updateTableSchema = createTableSchema.partial();

export const tableQuerySchema = paginationQuerySchema.extend({
  status: tableStatusEnum.optional(),
  location: z.string().trim().optional(),
  minCapacity: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const parsed = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type TableQueryParams = z.infer<typeof tableQuerySchema>;
