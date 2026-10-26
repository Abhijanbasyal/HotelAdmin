import { useState, useCallback } from 'react';
import { uploadAsset, uploadMultipleAssets, type AssetItem, type UploadOptions } from '@/services/api/asset.api';
import { toast } from 'sonner';

export interface UseAssetUploadReturn {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadFile: (file: File, options?: UploadOptions) => Promise<AssetItem | null>;
  uploadFiles: (files: File[], options?: UploadOptions) => Promise<AssetItem[] | null>;
  reset: () => void;
}

export function useAssetUpload(): UseAssetUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File, options?: UploadOptions): Promise<AssetItem | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const asset = await uploadAsset(file, options, (p) => setProgress(p));
        toast.success(`"${file.name}" uploaded successfully`);
        return asset;
      } catch (err: unknown) {
        const errorMsg =
          (err as { message?: string })?.message || 'Failed to upload file. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[], options?: UploadOptions): Promise<AssetItem[] | null> => {
      if (files.length === 0) return [];
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const assets = await uploadMultipleAssets(files, options, (p) => setProgress(p));
        toast.success(`${assets.length} files uploaded successfully`);
        return assets;
      } catch (err: unknown) {
        const errorMsg =
          (err as { message?: string })?.message || 'Failed to upload files. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    isUploading,
    progress,
    error,
    uploadFile,
    uploadFiles,
    reset,
  };
}
