import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const customerIdTypeEnum = z.enum(['passport', 'id_card', 'driving_license', 'other']);
export const customerStatusEnum = z.enum(['active', 'inactive']);

export const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(100, 'Customer name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(5, 'Phone number must be at least 5 characters')
    .max(30, 'Phone number cannot exceed 30 characters'),
  address: z.string().trim().max(300, 'Address cannot exceed 300 characters').optional(),
  idType: customerIdTypeEnum.default('passport'),
  idNumber: z.string().trim().max(50, 'ID number cannot exceed 50 characters').optional(),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  avatarUrl: z.string().trim().optional(),
  status: customerStatusEnum.default('active'),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = paginationQuerySchema.extend({
  status: customerStatusEnum.optional(),
  idType: customerIdTypeEnum.optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryParams = z.infer<typeof customerQuerySchema>;
