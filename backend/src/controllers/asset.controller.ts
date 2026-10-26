import type { Request, Response } from 'express';
import { AssetService } from '@/services/asset.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import type { UploadAssetBodyInput, AssetQueryParams } from '@/validators/asset.validator';

export class AssetController {
  /**
   * POST /api/v1/assets/upload
   * Upload a single asset file.
   */
  static uploadSingle = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.badRequest('No file provided in form field "file"');
    }

    const body = req.body as UploadAssetBodyInput;
    const asset = await AssetService.uploadSingle(
      req.file,
      {
        entityType: body.entityType,
        entityId: body.entityId,
        visibility: body.visibility,
      },
      req.user
    );

    return ApiResponse.created(res, asset, 'Asset uploaded successfully');
  });

  /**
   * POST /api/v1/assets/upload/multiple
   * Upload multiple asset files (up to 10).
   */
  static uploadMultiple = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw AppError.badRequest('No files provided in form field "files"');
    }

    const body = req.body as UploadAssetBodyInput;
    const assets = await AssetService.uploadMultiple(
      files,
      {
        entityType: body.entityType,
        entityId: body.entityId,
        visibility: body.visibility,
      },
      req.user
    );

    return ApiResponse.created(res, assets, `${assets.length} assets uploaded successfully`);
  });

  /**
   * GET /api/v1/assets
   * List assets with pagination and filters.
   */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AssetQueryParams;
    const result = await AssetService.getAssets(query);

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      'Assets retrieved successfully'
    );
  });

  /**
   * GET /api/v1/assets/:id
   * Get asset metadata by ID.
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const asset = await AssetService.getAssetById(id);

    return ApiResponse.success(res, asset, 'Asset retrieved successfully');
  });

  /**
   * DELETE /api/v1/assets/:id
   * Soft delete an asset record.
   */
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const asset = await AssetService.softDeleteAsset(id, req.user?.id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
    });

    return ApiResponse.success(res, asset, 'Asset soft-deleted successfully');
  });

  /**
   * PATCH /api/v1/assets/:id/restore
   * Restore a soft-deleted asset record.
   */
  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const asset = await AssetService.restoreAsset(id, req.user?.id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
    });

    return ApiResponse.success(res, asset, 'Asset restored successfully');
  });

  /**
   * GET /api/v1/assets/:id/view or /api/v1/assets/file/*
   * Stream asset file for inline viewing.
   */
  static viewFile = asyncHandler(async (req: Request, res: Response) => {
    // Identifier can come from /assets/:id/view or /assets/file/:subDir/:filename
    const identifier = req.params.id || (req.params as Record<string, string>)[0];
    if (!identifier) {
      throw AppError.badRequest('No asset identifier provided');
    }

    const { stream, asset } = await AssetService.getAssetStream(identifier, req.user);

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Length', asset.fileSize);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(asset.originalFilename)}"`);

    stream.pipe(res);
  });

  /**
   * GET /api/v1/assets/:id/download
   * Stream asset file as an attachment download.
   */
  static downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stream, asset } = await AssetService.getAssetStream(id, req.user);

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Length', asset.fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(asset.originalFilename)}"`);

    stream.pipe(res);
  });
}
