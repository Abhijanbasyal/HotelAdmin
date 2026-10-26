import { User } from '@/models/User.model';
import type { IRole } from '@/models/Role.model';
import { AppError } from '@/utils/AppError';
import {
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from './token.service';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticate a user with email and password.
 */
export async function loginUser(email: string, plainTextPassword: string): Promise<AuthResult> {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: false,
  })
    .select('+password')
    .populate<{ role: IRole }>('role');

  if (!user) {
    throw AppError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw AppError.forbidden('Your account has been deactivated. Please contact an administrator.');
  }

  const isPasswordValid = await user.verifyPassword(plainTextPassword);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password.');
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  const roleObj = user.role as unknown as IRole;
  const roleName = roleObj?.name || 'Staff';
  const permissions = roleObj?.permissions || [];

  const accessToken = await generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: roleName,
    permissions,
  });

  const { rawToken: refreshToken } = await createRefreshToken(user._id);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: roleName,
      permissions,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Rotate refresh token and issue a fresh access token.
 */
export async function refreshSession(
  rawRefreshToken: string
): Promise<{ accessToken: string; newRefreshToken: string; user: AuthResult['user'] }> {
  const { newRawToken, userId } = await rotateRefreshToken(rawRefreshToken);

  const user = await User.findOne({ _id: userId, isDeleted: false })
    .populate<{ role: IRole }>('role');

  if (!user || !user.isActive) {
    throw AppError.unauthorized('User session is no longer active.');
  }

  const roleObj = user.role as unknown as IRole;
  const roleName = roleObj?.name || 'Staff';
  const permissions = roleObj?.permissions || [];

  const accessToken = await generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: roleName,
    permissions,
  });

  return {
    accessToken,
    newRefreshToken: newRawToken,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: roleName,
      permissions,
      avatarUrl: user.avatarUrl,
    },
  };
}

/**
 * Log out a specific session by invalidating the refresh token.
 */
export async function logoutUser(rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }
}

/**
 * Log out all sessions for the given user.
 */
export async function logoutAllSessions(userId: string): Promise<void> {
  await revokeAllUserTokens(userId);
}

/**
 * Retrieve current user profile and effective permissions.
 */
export async function getCurrentUser(userId: string): Promise<AuthResult['user']> {
  const user = await User.findOne({ _id: userId, isDeleted: false })
    .populate<{ role: IRole }>('role');

  if (!user || !user.isActive) {
    throw AppError.notFound('User not found or inactive');
  }

  const roleObj = user.role as unknown as IRole;
  const roleName = roleObj?.name || 'Staff';
  const permissions = roleObj?.permissions || [];

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: roleName,
    permissions,
    avatarUrl: user.avatarUrl,
  };
}
