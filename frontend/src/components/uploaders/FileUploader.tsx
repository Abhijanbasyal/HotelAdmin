'use client';

import React, { useRef, useState, useCallback, useMemo, useId } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  X,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useAssetUpload } from '@/hooks/useAssetUpload';
import { getAssetUrl, type AssetItem, type UploadOptions } from '@/services/api/asset.api';
import { cn } from '@/lib/cn';

export interface FileUploaderProps {
  label?: string;
  description?: string;
  value?: string | string[];
  onChange?: (val: string | string[]) => void;
  onUploadComplete?: (assets: AssetItem | AssetItem[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  entityType?: UploadOptions['entityType'];
  entityId?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({
  label,
  description = 'PDF, DOCX, TXT, CSV up to 25MB',
  value,
  onChange,
  onUploadComplete,
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 25,
  accept = '.pdf,.doc,.docx,.txt,.csv',
  entityType = 'Document',
  entityId,
  disabled = false,
  className,
}: FileUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { isUploading, progress, uploadFile, uploadFiles } = useAssetUpload();

  const currentFiles: string[] = useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [value]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || disabled) return;
      setValidationError(null);

      const files = Array.from(fileList);

      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setValidationError(`File "${file.name}" exceeds the ${maxSizeMB}MB limit.`);
          return;
        }
      }

      if (multiple) {
        const remainingSlots = maxFiles - currentFiles.length;
        if (files.length > remainingSlots) {
          setValidationError(`You can only upload up to ${maxFiles} files (${remainingSlots} remaining).`);
          return;
        }

        const uploaded = await uploadFiles(files, { entityType, entityId });
        if (uploaded && uploaded.length > 0) {
          const newUrls = uploaded.map((a) => a.url);
          const combined = [...currentFiles, ...newUrls];
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

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [disabled, maxSizeMB, multiple, maxFiles, currentFiles, uploadFiles, entityType, entityId, onChange, onUploadComplete, uploadFile]
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
      const updated = currentFiles.filter((_, idx) => idx !== indexToRemove);
      onChange?.(updated);
    } else {
      onChange?.('');
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'xls' || ext === 'xlsx') {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt') {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <FileIcon className="h-5 w-5 text-slate-500" />;
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
        accept={accept}
        multiple={multiple}
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {/* Dropzone */}
      {(!currentFiles.length || multiple) && currentFiles.length < maxFiles && (
        <div
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          aria-label={label || 'Upload file'}
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

      {/* Uploaded Files List */}
      {currentFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          {currentFiles.map((fileUrl, index) => {
            const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
            const resolvedUrl = getAssetUrl(fileUrl);

            return (
              <div
                key={`${fileUrl}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                    {getFileIcon(fileName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {fileName}
                    </p>
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download / View</span>
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  title="Remove file"
                  aria-label="Remove file"
                  disabled={disabled || isUploading}
                  onClick={() => handleRemove(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
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
