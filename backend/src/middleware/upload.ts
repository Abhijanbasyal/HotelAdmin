import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { AppError } from '@/utils/AppError';

// Max file sizes (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB total ceiling

// Allowlisted MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void {
  if (!ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(
      AppError.badRequest(
        `File type '${file.mimetype}' is not permitted. Allowed types: images (JPEG, PNG, WebP, GIF, SVG), documents (PDF, DOCX, TXT, CSV), videos (MP4, WebM).`
      )
    );
    return;
  }
  cb(null, true);
}

// Memory storage keeps buffer in memory for validation and processing before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
  fileFilter,
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
