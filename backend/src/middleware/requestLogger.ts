import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * HTTP request logger middleware (Morgan-like but using pino).
 * Logs method, URL, status, and response time for every request.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    }, 'HTTP request');
  });

  next();
}
