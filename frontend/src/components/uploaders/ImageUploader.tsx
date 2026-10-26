'use client';

import React, { useRef, useState, useCallback, useMemo, useId } from 'react';
import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';
import { useAssetUpload } from '@/hooks/useAssetUpload';
import { getAssetUrl, type AssetItem, type UploadOptions } from '@/services/api/asset.api';
import { cn } from '@/lib/cn';

export interface ImageUploaderProps {
  label?: string;
  description?: string;
  value?: string | string[];
  onChange?: (val: string | string[]) => void;
  onUploadComplete?: (assets: AssetItem | AssetItem[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  entityType?: UploadOptions['entityType'];
  entityId?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  label,
  description = 'PNG, JPG, WebP, GIF up to 10MB',
  value,
  onChange,
  onUploadComplete,
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 10,
  entityType = 'General',
  entityId,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isUploading, progress, uploadFile, uploadFiles } = useAssetUpload();

  // Normalize value to an array of string URLs
  const currentImages: string[] = useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [value]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || disabled) return;
      setValidationError(null);

      const files = Array.from(fileList);
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

      // Validate files
      for (const file of files) {
        if (!validTypes.includes(file.type)) {
          setValidationError(`File "${file.name}" is not a supported image format.`);
          return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          setValidationError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
          return;
        }
      }

      if (multiple) {
        const remainingSlots = maxFiles - currentImages.length;
        if (files.length > remainingSlots) {
          setValidationError(`You can only upload up to ${maxFiles} images (${remainingSlots} remaining).`);
          return;
        }

        const uploaded = await uploadFiles(files, { entityType, entityId });
        if (uploaded && uploaded.length > 0) {
          const newUrls = uploaded.map((a) => a.url);
          const combined = [...currentImages, ...newUrls];
          onChange?.(combined);
          onUploadComplete?.(uploaded);
        }
      } else {
        const uploaded = await uploadFile(files[0]!, { entityType, entityId });
        if (uploaded) {
          onChange?.(uploaded.url);
          onUploadComplete?.(uploaded);
        }
      }

      // Reset file input value so re-selecting same file triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [disabled, maxSizeMB, multiple, maxFiles, currentImages, uploadFiles, entityType, entityId, onChange, onUploadComplete, uploadFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!disabled && !isUploading) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (disabled || isUploading) return;
    if (multiple) {
      const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
      onChange?.(updated);
    } else {
      onChange?.('');
    }
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Hidden File Input */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        multiple={multiple}
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Dropzone */}
      {(!currentImages.length || multiple) && currentImages.length < maxFiles && (
        <div
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          aria-label={label || 'Upload image'}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
            isDragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-primary/60 dark:hover:border-primary/60 hover:bg-slate-50 dark:hover:bg-slate-800/40',
            (disabled || isUploading) && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading {progress}%...</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <UploadCloud className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span className="text-primary hover:underline">Click to browse</span> or drag and drop
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </>
          )}
        </div>
      )}

      {/* Validation Error Message */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Uploaded Images Preview Grid */}
      {currentImages.length > 0 && (
        <div
          className={cn(
            'grid gap-3 pt-2',
            multiple
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              : 'grid-cols-1 max-w-xs'
          )}
        >
          {currentImages.map((imgUrl, index) => {
            const resolvedUrl = getAssetUrl(imgUrl);
            return (
              <div
                key={`${imgUrl}-${index}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedUrl}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to generic icon on load failure
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Remove button overlay */}
                <button
                  type="button"
                  title="Remove image"
                  aria-label="Remove image"
                  disabled={disabled || isUploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white backdrop-blur-sm transition-transform hover:scale-110 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
