import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const createDepartmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(100, 'Department name cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Department code is required' })
    .trim()
    .toUpperCase()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code cannot exceed 20 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryParams = z.infer<typeof departmentQuerySchema>;
