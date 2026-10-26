import { apiPost, apiGet, setAccessToken, type ApiResponse } from './client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  avatarUrl?: string;
}

export interface LoginResponseData {
  user: UserProfile;
  accessToken: string;
}

export interface RefreshResponseData {
  user: UserProfile;
  accessToken: string;
}

/**
 * Authenticate with email & password.
 */
export async function loginApi(credentials: {
  email: string;
  password: string;
}): Promise<ApiResponse<LoginResponseData>> {
  const response = await apiPost<LoginResponseData>('/auth/login', credentials);
  if (response.data?.accessToken) {
    setAccessToken(response.data.accessToken);
  }
  return response;
}

/**
 * Refresh access token using HttpOnly cookie.
 */
export async function refreshApi(): Promise<ApiResponse<RefreshResponseData>> {
  const response = await apiPost<RefreshResponseData>('/auth/refresh');
  if (response.data?.accessToken) {
    setAccessToken(response.data.accessToken);
  }
  return response;
}

/**
 * Terminate current user session and revoke refresh cookie.
 */
export async function logoutApi(): Promise<ApiResponse<void>> {
  try {
    return await apiPost<void>('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

/**
 * Terminate all sessions for the current user.
 */
export async function logoutAllApi(): Promise<ApiResponse<void>> {
  try {
    return await apiPost<void>('/auth/logout-all');
  } finally {
    setAccessToken(null);
  }
}

/**
 * Fetch current authenticated user's profile and permissions.
 */
export async function getMeApi(): Promise<ApiResponse<UserProfile>> {
  return await apiGet<UserProfile>('/auth/me');
}
