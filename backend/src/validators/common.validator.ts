import { z } from 'zod';
import { Types } from 'mongoose';

/**
 * Validates a 24-hex MongoDB ObjectId.
 */
export const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format (must be 24 hex characters)',
  });

/**
 * Standard path parameter schema for routes with /:id
 */
export const idParamSchema = z.object({
  id: objectIdSchema,
});

/**
 * Standard pagination and filtering query parameters schema.
 */
export const paginationQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return 1;
      const parsed = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return 10;
      const parsed = typeof val === 'number' ? val : parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) return 10;
      return parsed > 100 ? 100 : parsed;
    }),
  sortBy: z.string().trim().optional(),
  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform((val) => (val?.toLowerCase() === 'asc' ? ('asc' as const) : ('desc' as const)))
    .default('desc'),
  search: z.string().trim().optional(),
  includeDeleted: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    })
    .default(false),
});

/**
 * Optional date range query parameters schema.
 */
export const dateRangeQuerySchema = z
  .object({
    startDate: z
      .string()
      .datetime({ message: 'startDate must be a valid ISO datetime' })
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'endDate must be a valid ISO datetime' })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'endDate cannot be before startDate',
      path: ['endDate'],
    }
  );

export type PaginationQueryParams = z.infer<typeof paginationQuerySchema>;
export type DateRangeQueryParams = z.infer<typeof dateRangeQuerySchema>;
