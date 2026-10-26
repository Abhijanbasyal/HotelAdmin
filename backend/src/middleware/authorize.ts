import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import '@/types/auth.types';

/**
 * Middleware factory: requires specific permissions to access a route.
 * Super Admin or wildcard '*' grants full access.
 */
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required before authorization.'));
    }

    const { role, permissions } = req.user;

    // Super Admin bypass
    if (role === 'Super Admin' || permissions.includes('*')) {
      return next();
    }

    // Check if user has all required permissions
    const hasAll = requiredPermissions.every((perm) => permissions.includes(perm));

    if (!hasAll) {
      return next(
        AppError.forbidden(
          `You do not have the required permissions: [${requiredPermissions.join(', ')}]`
        )
      );
    }

    next();
  };
}
