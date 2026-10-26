import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler or middleware to catch any rejected promises
 * and pass them to Express's next() error handler, preventing unhandled promise rejections
 * and satisfying TypeScript's no-misused-promises ESLint rule.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    void fn(req, res, next).catch(next);
  };
}
