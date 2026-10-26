/**
 * Base class for known, operational errors.
 * These are handled gracefully by the centralized error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean = true;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper prototype chain in TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Factory helpers ────────────────────────────────────────────────────────

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  static unprocessable(message: string, details?: unknown): AppError {
    return new AppError(message, 422, 'UNPROCESSABLE', details);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError(message, 429, 'RATE_LIMITED');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}
