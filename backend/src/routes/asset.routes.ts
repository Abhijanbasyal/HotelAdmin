import { Router } from 'express';
import { AssetController } from '@/controllers/asset.controller';
import { authenticate } from '@/middleware/authenticate';
import { uploadSingle, uploadMultiple } from '@/middleware/upload';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import { uploadAssetBodySchema, assetQuerySchema } from '@/validators/asset.validator';

export const assetRouter = Router();

// ── Public / Semi-public asset viewing & streaming ─────────────────────────
// Inline viewing via storage key: /api/v1/assets/file/images/products/...
assetRouter.get('/file/*', AssetController.viewFile);

// Inline viewing via asset ID: /api/v1/assets/:id/view
assetRouter.get(
  '/:id/view',
  validateRequest(idParamSchema, 'params'),
  AssetController.viewFile
);

// Attachment download: /api/v1/assets/:id/download
assetRouter.get(
  '/:id/download',
  validateRequest(idParamSchema, 'params'),
  AssetController.downloadFile
);

// ── Protected asset management endpoints ───────────────────────────────────
// Single file upload
assetRouter.post(
  '/upload',
  asyncHandler(authenticate),
  uploadSingle,
  validateRequest(uploadAssetBodySchema, 'body'),
  AssetController.uploadSingle
);

// Multiple files upload
assetRouter.post(
  '/upload/multiple',
  asyncHandler(authenticate),
  uploadMultiple,
  validateRequest(uploadAssetBodySchema, 'body'),
  AssetController.uploadMultiple
);

// List assets (metadata)
assetRouter.get(
  '/',
  asyncHandler(authenticate),
  validateRequest(assetQuerySchema, 'query'),
  AssetController.list
);

// Get single asset metadata
assetRouter.get(
  '/:id',
  asyncHandler(authenticate),
  validateRequest(idParamSchema, 'params'),
  AssetController.getById
);

// Soft delete asset
assetRouter.delete(
  '/:id',
  asyncHandler(authenticate),
  validateRequest(idParamSchema, 'params'),
  AssetController.delete
);

// Restore soft-deleted asset
assetRouter.patch(
  '/:id/restore',
  asyncHandler(authenticate),
  validateRequest(idParamSchema, 'params'),
  AssetController.restore
);
