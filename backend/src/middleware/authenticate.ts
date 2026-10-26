import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/services/token.service';
import { AppError } from '@/utils/AppError';
import '@/types/auth.types';

/**
 * Middleware: authenticates requests via Bearer access token in the Authorization header.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Authentication token missing or invalid.'));
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return next(AppError.unauthorized('Bearer token cannot be empty.'));
  }

  try {
    const payload = await verifyAccessToken(token);

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
}
