import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';

/**
 * Centralized error handler.
 * Must be registered LAST in the Express middleware chain.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // ── 1. Malformed JSON Body (SyntaxError) ───────────────────
  if (isMalformedJsonError(err)) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.',
      code: 'INVALID_JSON',
    });
    return;
  }

  // ── 2. Zod validation errors ──────────────────────────────
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: fieldErrors,
    });
    return;
  }

  // ── 3. Application operational errors ─────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, req: { method: req.method, url: req.url } }, err.message);
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // ── 4. Mongoose Schema Validation Error ───────────────────
  if (isMongooseValidationError(err)) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, errorDetail] of Object.entries(err.errors)) {
      fieldErrors[key] = [errorDetail.message];
    }

    res.status(422).json({
      success: false,
      message: 'Database validation failed',
      code: 'VALIDATION_ERROR',
      errors: fieldErrors,
    });
    return;
  }

  // ── 5. Mongoose duplicate key error ───────────────────────
  if (isMongooseDuplicateKeyError(err)) {
    const field = extractDuplicateField(err);
    res.status(409).json({
      success: false,
      message: field ? `A record with this ${field} already exists.` : 'A record with duplicate unique fields already exists.',
      code: 'DUPLICATE_KEY',
      details: { field },
    });
    return;
  }

  // ── 6. Mongoose cast error (invalid ObjectId, etc.) ───────
  if (isMongooseCastError(err)) {
    res.status(400).json({
      success: false,
      message: `Invalid format for identifier '${err.path}': ${String(err.value)}.`,
      code: 'INVALID_ID',
    });
    return;
  }

  // ── 7. Multer file upload errors ──────────────────────────
  if (isMulterError(err)) {
    res.status(400).json({
      success: false,
      message: err.message || 'File upload error.',
      code: err.code || 'UPLOAD_ERROR',
    });
    return;
  }

  // ── 8. JWT / auth errors ──────────────────────────────────
  if (isJwtError(err)) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  // ── 9. Unknown / unhandled unexpected errors ──────────────
  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled server error');

  res.status(500).json({
    success: false,
    message:
      process.env['NODE_ENV'] === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : (err instanceof Error ? err.message : 'Internal server error'),
    code: 'INTERNAL_ERROR',
  });
}

// ── Type guards ────────────────────────────────────────────────────────────────

function isMalformedJsonError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status: number }).status === 400 &&
    'body' in err
  );
}

interface MongooseValidationErrorLike {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

function isMongooseValidationError(err: unknown): err is MongooseValidationErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'ValidationError' &&
    'errors' in err &&
    typeof (err as { errors: unknown }).errors === 'object'
  );
}

function isMongooseDuplicateKeyError(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000;
}

interface MongooseCastErrorLike {
  name: 'CastError';
  path: string;
  value: unknown;
}

function isMongooseCastError(err: unknown): err is MongooseCastErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'CastError'
  );
}

interface MulterErrorLike {
  name: 'MulterError';
  message: string;
  code: string;
}

function isMulterError(err: unknown): err is MulterErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'MulterError'
  );
}

function isJwtError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const name = (err as { name?: string }).name;
  return name === 'JWTExpired' || name === 'JWTInvalid' || name === 'JWTClaimValidationFailed';
}

function extractDuplicateField(err: { keyValue?: Record<string, unknown> }): string | null {
  if (!err.keyValue) return null;
  const keys = Object.keys(err.keyValue);
  return keys.length > 0 ? (keys[0] ?? null) : null;
}
