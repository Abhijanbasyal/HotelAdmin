import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const auditLogQuerySchema = paginationQuerySchema.extend({
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  action: z.string().trim().optional(),
  startDate: z.string().datetime({ message: 'startDate must be a valid ISO datetime' }).optional(),
  endDate: z.string().datetime({ message: 'endDate must be a valid ISO datetime' }).optional(),
});

export type AuditLogQueryParams = z.infer<typeof auditLogQuerySchema>;
