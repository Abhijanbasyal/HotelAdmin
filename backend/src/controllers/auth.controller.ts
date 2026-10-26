import type { Request, Response, NextFunction } from 'express';
import {
  loginUser,
  refreshSession,
  logoutUser,
  logoutAllSessions,
  getCurrentUser,
} from '@/services/auth.service';
import { refreshTokenCookieOptions } from '@/config/security';
import { AppError } from '@/utils/AppError';
import type { LoginInput, RefreshTokenInput } from '@/validators/auth.validator';
import '@/types/auth.types';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await loginUser(email, password);

    // Set HttpOnly refresh token cookie
    res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const body = req.body as RefreshTokenInput | undefined;

    const rawRefreshToken = cookies?.refreshToken || body?.refreshToken;

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw AppError.unauthorized('Refresh token missing from cookies or request body.');
    }

    const result = await refreshSession(rawRefreshToken);

    // Rotate HttpOnly cookie
    res.cookie('refreshToken', result.newRefreshToken, refreshTokenCookieOptions);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookies = req.cookies as Record<string, string> | undefined;
    const body = req.body as RefreshTokenInput | undefined;
    const rawRefreshToken = cookies?.refreshToken || body?.refreshToken;

    await logoutUser(typeof rawRefreshToken === 'string' ? rawRefreshToken : undefined);

    // Clear refresh cookie
    res.clearCookie('refreshToken', {
      ...refreshTokenCookieOptions,
      maxAge: 0,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    await logoutAllSessions(req.user.id);

    // Clear refresh cookie
    res.clearCookie('refreshToken', {
      ...refreshTokenCookieOptions,
      maxAge: 0,
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out from all active sessions.',
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    const user = await getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
}
