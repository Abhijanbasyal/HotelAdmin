import sharp from 'sharp';
import type { FilterQuery, Types } from 'mongoose';
import { Asset, type IAsset, type AssetEntityType, type AssetVisibility } from '@/models/Asset.model';
import { storageService } from './storage.service';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_VIDEO_SIZE,
} from '@/middleware/upload';

export interface UploadAssetOptions {
  entityType?: AssetEntityType;
  entityId?: string;
  visibility?: AssetVisibility;
  subFolder?: string;
}

export interface AssetFilterQuery {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  entityType?: string;
  entityId?: string;
  visibility?: string;
  search?: string;
  includeDeleted?: boolean | string;
}

export interface UserContext {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export class AssetService {
  /**
   * Resolves the storage subdirectory based on MIME type and entity type.
   */
  private static resolveSubDirectory(mimeType: string, entityType: AssetEntityType): string {
    const entityLower = entityType.toLowerCase();

    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      if (['product', 'category', 'user', 'staff', 'customer'].includes(entityLower)) {
        return `images/${entityLower}s`;
      }
      return 'images/general';
    }

    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      if (['product', 'user'].includes(entityLower)) {
        return `videos/${entityLower}s`;
      }
      return 'videos/general';
    }

    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) {
      return 'files/documents';
    }

    return 'files/general';
  }

  /**
   * Validates file size limits based on category.
   */
  private static validateFileSize(file: Express.Multer.File): void {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && file.size > MAX_IMAGE_SIZE) {
      throw AppError.badRequest(
        `Image size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 10MB`
      );
    }
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype) && file.size > MAX_DOCUMENT_SIZE) {
      throw AppError.badRequest(
        `Document size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 25MB`
      );
    }
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype) && file.size > MAX_VIDEO_SIZE) {
      throw AppError.badRequest(
        `Video size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of 50MB`
      );
    }
  }

  /**
   * Processes an uploaded file buffer, extracts image metadata via Sharp, writes to disk, and records metadata in MongoDB.
   */
  static async uploadSingle(
    file: Express.Multer.File,
    options: UploadAssetOptions = {},
    user?: UserContext
  ): Promise<IAsset> {
    if (!file || !file.buffer) {
      throw AppError.badRequest('No file uploaded or file buffer is empty');
    }

    // 1. Validate file size according to content type
    this.validateFileSize(file);

    const entityType: AssetEntityType = options.entityType || 'General';
    const visibility: AssetVisibility = options.visibility || 'public';
    const subDirectory = options.subFolder || this.resolveSubDirectory(file.mimetype, entityType);

    let imageWidth: number | undefined;
    let imageHeight: number | undefined;

    // 2. Extract and validate image metadata with Sharp (for image types)
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && file.mimetype !== 'image/svg+xml') {
      try {
        const metadata = await sharp(file.buffer).metadata();
        imageWidth = metadata.width;
        imageHeight = metadata.height;

        if (imageWidth && imageHeight && (imageWidth > 6000 || imageHeight > 6000)) {
          throw AppError.badRequest('Image dimensions cannot exceed 6000x6000 pixels');
        }
      } catch (sharpErr) {
        if (sharpErr instanceof AppError) throw sharpErr;
        throw AppError.badRequest('Invalid or corrupted image format');
      }
    }

    // 3. Write file to local disk
    const stored = await storageService.saveFile(
      file.buffer,
      subDirectory,
      file.originalname,
      file.mimetype
    );

    // 4. Save metadata record in MongoDB
    try {
      const asset = await Asset.create({
        ownerId: user ? user.id : undefined,
        entityType,
        entityId: options.entityId,
        originalFilename: file.originalname,
        storageKey: stored.storageKey,
        storageProvider: 'local',
        mimeType: file.mimetype,
        fileSize: stored.fileSize,
        imageWidth,
        imageHeight,
        visibility,
        isDeleted: false,
      });

      // 5. Audit log
      void AuditService.logEvent({
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.role,
        action: 'UPLOAD',
        entityType: 'Asset',
        entityId: asset._id.toString(),
        details: {
          originalFilename: file.originalname,
          storageKey: stored.storageKey,
          fileSize: stored.fileSize,
          mimeType: file.mimetype,
        },
      });

      return asset;
    } catch (dbErr) {
      // Cleanup disk on database creation failure
      await storageService.deleteFile(stored.storageKey);
      throw dbErr;
    }
  }

  /**
   * Uploads multiple files concurrently.
   */
  static async uploadMultiple(
    files: Express.Multer.File[],
    options: UploadAssetOptions = {},
    user?: UserContext
  ): Promise<IAsset[]> {
    if (!files || files.length === 0) {
      throw AppError.badRequest('No files uploaded');
    }

    if (files.length > 10) {
      throw AppError.badRequest('Maximum 10 files can be uploaded at once');
    }

    const results: IAsset[] = [];
    for (const file of files) {
      const asset = await this.uploadSingle(file, options, user);
      results.push(asset);
    }

    return results;
  }

  /**
   * Retrieves an asset metadata record by ID.
   */
  static async getAssetById(id: string): Promise<IAsset> {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw AppError.notFound('Asset');
    }
    return asset;
  }

  /**
   * Retrieves an asset record by storage key.
   */
  static async getAssetByStorageKey(storageKey: string): Promise<IAsset> {
    const asset = await Asset.findOne({ storageKey });
    if (!asset) {
      throw AppError.notFound('Asset');
    }
    return asset;
  }

  /**
   * Retrieves a paginated list of assets with filtering.
   */
  static async getAssets(query: AssetFilterQuery): Promise<IPaginatedResult<IAsset>> {
    const allowedSort = ['createdAt', 'fileSize', 'originalFilename', 'entityType'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<IAsset> = {};

    if (query.entityType) {
      filter.entityType = query.entityType;
    }

    if (query.entityId) {
      filter.entityId = query.entityId;
    }

    if (query.visibility) {
      filter.visibility = query.visibility;
    }

    if (options.search) {
      filter.$or = [
        { originalFilename: { $regex: options.search, $options: 'i' } },
        { storageKey: { $regex: options.search, $options: 'i' } },
      ];
    }

    return paginateQuery(Asset, filter, options);
  }

  /**
   * Soft deletes an asset. Does not physically delete binary files to preserve historical data.
   */
  static async softDeleteAsset(
    id: string,
    userId?: string | Types.ObjectId,
    reqContext?: AuditRequestContext
  ): Promise<IAsset> {
    return softDeleteDocument(Asset, id, userId, reqContext);
  }

  /**
   * Restores a soft-deleted asset.
   */
  static async restoreAsset(
    id: string,
    userId?: string | Types.ObjectId,
    reqContext?: AuditRequestContext
  ): Promise<IAsset> {
    return restoreDocument(Asset, id, userId, { reqContext });
  }

  /**
   * Verifies access and retrieves a readable stream to download/serve an asset file.
   */
  static async getAssetStream(
    identifier: string,
    user?: UserContext
  ): Promise<{ stream: NodeJS.ReadableStream; asset: IAsset }> {
    // Check if identifier is an ObjectId or storageKey
    const asset = identifier.includes('/')
      ? await this.getAssetByStorageKey(identifier)
      : await this.getAssetById(identifier);

    // Visibility permission check
    if (asset.visibility === 'private') {
      if (!user) {
        throw AppError.unauthorized('Authentication required to view private assets');
      }
      const isOwner = asset.ownerId && asset.ownerId.toString() === user.id;
      const isAdmin = user.role === 'Super Admin' || user.permissions.includes('*');

      if (!isOwner && !isAdmin) {
        throw AppError.forbidden('You do not have permission to access this private asset');
      }
    }

    const stream = storageService.getFileStream(asset.storageKey);
    return { stream, asset };
  }
}
