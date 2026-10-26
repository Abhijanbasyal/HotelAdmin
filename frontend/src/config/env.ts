/**
 * Environment variable access for the frontend.
 *
 * All NEXT_PUBLIC_* variables are inlined at build time.
 * Non-public variables are only available server-side.
 *
 * Usage: import { clientEnv } from '@/config/env';
 */

export function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}\n` +
        `Check your .env.local file and ensure it includes ${key}=<value>`
    );
  }
  return value;
}

export function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

/**
 * Client-safe environment variables (NEXT_PUBLIC_*).
 * These are embedded into the JavaScript bundle — never put secrets here.
 */
export const clientEnv = {
  /** Backend API base URL, e.g. http://localhost:4000/api/v1 */
  apiBaseUrl: optional('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:4000/api/v1'),

  /** Application name shown in the UI */
  appName: optional('NEXT_PUBLIC_APP_NAME', 'Hotel Management'),

  /** Application version */
  appVersion: optional('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
} as const;

/**
 * Server-only environment variables (no NEXT_PUBLIC_ prefix).
 * Only call this from Server Components or API routes.
 */
export function getServerEnv() {
  return {
    nodeEnv: optional('NODE_ENV', 'development'),
  };
}

export type ClientEnv = typeof clientEnv;
