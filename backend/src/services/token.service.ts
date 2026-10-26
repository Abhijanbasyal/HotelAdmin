import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { Types } from 'mongoose';
import { env } from '@/config/env';
import { RefreshToken } from '@/models/RefreshToken.model';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

const accessSecretKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

/**
 * Generate a short-lived signed JWT access token.
 */
export async function generateAccessToken(payload: AccessTokenPayload): Promise<string> {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(accessSecretKey);
}

/**
 * Verify and decode an access token.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      permissions: (payload.permissions as string[]) || [],
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid token';
    throw AppError.unauthorized(`Access token verification failed: ${errorMessage}`);
  }
}

/**
 * Hash a raw refresh token using SHA-256 for secure database storage.
 */
function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Create a new refresh token and persist its hash in MongoDB.
 */
export async function createRefreshToken(
  userId: string | Types.ObjectId,
  existingFamily?: string
): Promise<{ rawToken: string; family: string }> {
  const rawToken = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashRefreshToken(rawToken);
  const family = existingFamily || crypto.randomUUID();

  // 7 days expiration in milliseconds
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);

  await RefreshToken.create({
    tokenHash,
    userId: new Types.ObjectId(userId.toString()),
    family,
    isRevoked: false,
    expiresAt,
  });

  return { rawToken, family };
}

/**
 * Rotate a refresh token:
 * - Detects token reuse (if an already-revoked token is presented, entire family is revoked).
 * - Invalidates the presented token.
 * - Issues a new token within the same token family.
 */
export async function rotateRefreshToken(
  rawToken: string
): Promise<{ newRawToken: string; userId: string; family: string }> {
  const tokenHash = hashRefreshToken(rawToken);
  const existingToken = await RefreshToken.findOne({ tokenHash });

  if (!existingToken) {
    throw AppError.unauthorized('Invalid refresh token.');
  }

  // Token reuse detection: if a revoked token is presented, someone may have compromised it
  if (existingToken.isRevoked) {
    logger.warn(
      { family: existingToken.family, userId: existingToken.userId },
      'Token reuse detected! Revoking entire token family.'
    );
    await RefreshToken.updateMany({ family: existingToken.family }, { isRevoked: true });
    throw AppError.unauthorized('Invalid session detected. Please log in again.');
  }

  // Check expiration
  if (existingToken.expiresAt < new Date()) {
    existingToken.isRevoked = true;
    await existingToken.save();
    throw AppError.unauthorized('Refresh token expired. Please log in again.');
  }

  // Invalidate current token
  existingToken.isRevoked = true;
  await existingToken.save();

  // Issue new token in same family
  const { rawToken: newRawToken, family } = await createRefreshToken(
    existingToken.userId,
    existingToken.family
  );

  return {
    newRawToken,
    userId: existingToken.userId.toString(),
    family,
  };
}

/**
 * Revoke a single refresh token (e.g. on standard logout).
 */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
}

/**
 * Revoke all active sessions for a user (e.g. logout from all devices or password reset).
 */
export async function revokeAllUserTokens(userId: string | Types.ObjectId): Promise<void> {
  await RefreshToken.updateMany(
    { userId: new Types.ObjectId(userId.toString()) },
    { isRevoked: true }
  );
}
