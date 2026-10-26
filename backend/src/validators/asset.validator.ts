import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const uploadAssetBodySchema = z.object({
  entityType: z
    .enum(['Product', 'Category', 'User', 'Staff', 'Customer', 'General', 'Document'])
    .optional()
    .default('General'),
  entityId: z.string().trim().optional(),
  visibility: z.enum(['public', 'private']).optional().default('public'),
});

export const assetQuerySchema = paginationQuerySchema.extend({
  entityType: z.string().trim().optional(),
  entityId: z.string().trim().optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

export type UploadAssetBodyInput = z.infer<typeof uploadAssetBodySchema>;
export type AssetQueryParams = z.infer<typeof assetQuerySchema>;
