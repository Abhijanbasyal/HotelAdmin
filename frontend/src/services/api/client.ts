import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { clientEnv } from '@/config/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ── Token management (Phase 2 will fill this in) ──────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ── Refresh state — prevents concurrent refresh attempts ──────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeToRefresh(callback: (token: string | null) => void): void {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(token: string | null): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: clientEnv.apiBaseUrl,
  withCredentials: true, // Send HttpOnly refresh-token cookies
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor — attach access token ─────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 and refresh ────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // Only attempt refresh for 401s that haven't already been retried
    // and aren't on the auth endpoints themselves
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          subscribeToRefresh((newToken) => {
            if (newToken && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        // Phase 2 will implement the actual refresh endpoint call here
        const refreshResponse = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${clientEnv.apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshResponse.data.data?.accessToken ?? null;
        setAccessToken(newToken);
        notifyRefreshSubscribers(newToken);

        if (newToken && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear state and redirect to login
        setAccessToken(null);
        notifyRefreshSubscribers(null);

        // Phase 2 will handle the redirect via auth context
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize the error for consumers
    const apiError: ApiError = {
      message:
        error.response?.data?.message ??
        error.message ??
        'An unexpected error occurred',
      code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
      errors: error.response?.data?.errors,
      statusCode: error.response?.status ?? 0,
    };

    return Promise.reject(apiError);
  }
);

// ── Typed request helpers ──────────────────────────────────────────────────────

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url, config);
  return response.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
  return response.data;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config);
  return response.data;
}
