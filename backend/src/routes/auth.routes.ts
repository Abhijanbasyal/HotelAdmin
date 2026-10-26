import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authRateLimitOptions } from '@/config/security';
import { validateRequest } from '@/middleware/validateRequest';
import { authenticate } from '@/middleware/authenticate';
import { asyncHandler } from '@/utils/asyncHandler';
import { loginSchema, refreshTokenSchema } from '@/validators/auth.validator';
import * as authController from '@/controllers/auth.controller';

export const authRouter = Router();

const authRateLimiter = rateLimit(authRateLimitOptions);

// Public auth endpoints
authRouter.post('/login', authRateLimiter, validateRequest(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', validateRequest(refreshTokenSchema), asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));

// Protected auth endpoints
authRouter.post('/logout-all', asyncHandler(authenticate), asyncHandler(authController.logoutAll));
authRouter.get('/me', asyncHandler(authenticate), asyncHandler(authController.me));
