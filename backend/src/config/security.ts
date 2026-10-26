import type { HelmetOptions } from 'helmet';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import { env } from './env';

/**
 * Helmet security headers configuration.
 */
export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // May need to be false for asset serving
  hsts: {
    maxAge: 31_536_000,
    includeSubDomains: true,
    preload: true,
  },
};

/**
 * Global rate limiter — applied to all routes.
 */
export const globalRateLimitOptions: Partial<RateLimitOptions> = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: () => env.NODE_ENV === 'test',
};

/**
 * Strict rate limiter for authentication endpoints.
 */
export const authRateLimitOptions: Partial<RateLimitOptions> = {
  windowMs: 15 * 60 * 1_000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  skip: () => env.NODE_ENV === 'test',
};

/**
 * Cookie options for the HttpOnly refresh-token cookie.
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  domain: env.COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1_000, // 7 days in milliseconds
  path: '/api/v1/auth', // Scope cookie to auth endpoints only
} as const;
