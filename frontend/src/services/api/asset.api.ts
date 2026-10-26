import { apiClient, type ApiResponse } from './client';
import { clientEnv } from '@/config/env';

export interface AssetItem {
  id: string;
  _id?: string;
  originalFilename: string;
  storageKey: string;
  storageProvider: string;
  mimeType: string;
  fileSize: number;
  imageWidth?: number;
  imageHeight?: number;
  videoDuration?: number;
  visibility: 'public' | 'private';
  url: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface UploadOptions {
  entityType?: 'Product' | 'Category' | 'User' | 'Staff' | 'Customer' | 'General' | 'Document';
  entityId?: string;
  visibility?: 'public' | 'private';
}

/**
 * Returns full URL to view an asset via the backend API.
 */
export function getAssetUrl(storageKeyOrPath: string): string {
  if (!storageKeyOrPath) return '';
  if (storageKeyOrPath.startsWith('http://') || storageKeyOrPath.startsWith('https://')) {
    return storageKeyOrPath;
  }
  const cleanPath = storageKeyOrPath.replace(/^\/+/, '');
  if (cleanPath.startsWith('api/v1/assets/')) {
    return `${clientEnv.apiBaseUrl.replace(/\/api\/v1\/?$/, '')}/${cleanPath}`;
  }
  return `${clientEnv.apiBaseUrl}/assets/file/${cleanPath}`;
}

/**
 * Upload a single file with optional upload progress callback.
 */
export async function uploadAsset(
  file: File,
  options: UploadOptions = {},
  onProgress?: (percentage: number) => void
): Promise<AssetItem> {
  const formData = new FormData();
  formData.append('file', file);

  if (options.entityType) {
    formData.append('entityType', options.entityType);
  }
  if (options.entityId) {
    formData.append('entityId', options.entityId);
  }
  if (options.visibility) {
    formData.append('visibility', options.visibility);
  }

  const response = await apiClient.post<ApiResponse<AssetItem>>('/assets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data.data!;
}

/**
 * Upload multiple files with progress tracking.
 */
export async function uploadMultipleAssets(
  files: File[],
  options: UploadOptions = {},
  onProgress?: (percentage: number) => void
): Promise<AssetItem[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  if (options.entityType) {
    formData.append('entityType', options.entityType);
  }
  if (options.entityId) {
    formData.append('entityId', options.entityId);
  }
  if (options.visibility) {
    formData.append('visibility', options.visibility);
  }

  const response = await apiClient.post<ApiResponse<AssetItem[]>>('/assets/upload/multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data.data!;
}

/**
 * Retrieve metadata for a single asset.
 */
export async function getAsset(id: string): Promise<AssetItem> {
  const response = await apiClient.get<ApiResponse<AssetItem>>(`/assets/${id}`);
  return response.data.data!;
}

/**
 * Soft delete an asset.
 */
export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`/assets/${id}`);
}

/**
 * Restore a soft-deleted asset.
 */
export async function restoreAsset(id: string): Promise<void> {
  await apiClient.patch(`/assets/${id}/restore`);
}
