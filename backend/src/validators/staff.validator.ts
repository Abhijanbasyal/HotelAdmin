import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from './common.validator';

export const createStaffSchema = z.object({
  name: z
    .string({ required_error: 'Staff name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  role: objectIdSchema,
  department: objectIdSchema
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
  phone: z.string().trim().max(30, 'Phone cannot exceed 30 characters').optional(),
  jobTitle: z.string().trim().max(100, 'Job title cannot exceed 100 characters').optional(),
  avatarUrl: z.string().trim().optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return true;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    })
    .default(true),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(8).max(100).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  role: objectIdSchema.optional(),
  department: objectIdSchema
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' || val === undefined ? undefined : val)),
  phone: z.string().trim().max(30).optional(),
  jobTitle: z.string().trim().max(100).optional(),
  avatarUrl: z.string().trim().optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    }),
});

export const staffQuerySchema = paginationQuerySchema.extend({
  role: objectIdSchema.optional(),
  department: objectIdSchema.optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === '1';
    }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type StaffQueryParams = z.infer<typeof staffQuerySchema>;
