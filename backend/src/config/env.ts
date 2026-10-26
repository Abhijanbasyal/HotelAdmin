import 'dotenv/config';
import { cleanEnv, str, port, url, num } from 'envalid';

/**
 * Validated, typed environment variables.
 * The app will throw at startup if any required variable is missing or malformed.
 */
export const env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 4000 }),
  API_VERSION: str({ default: 'v1' }),

  // MongoDB
  MONGODB_URI: url({ docs: 'https://www.mongodb.com/docs/manual/reference/connection-string/' }),

  // JWT
  JWT_ACCESS_SECRET: str({ docs: 'Must be a strong random string (≥ 32 chars)' }),
  JWT_REFRESH_SECRET: str({ docs: 'Must be a strong random string (≥ 32 chars)' }),
  JWT_ACCESS_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  JWT_ISSUER: str({ default: 'hotel-management-api' }),
  JWT_AUDIENCE: str({ default: 'hotel-management-app' }),

  // Cookie
  COOKIE_SECRET: str({ docs: 'Secret for signing cookies' }),
  COOKIE_DOMAIN: str({ default: 'localhost' }),

  // CORS
  CORS_ORIGIN: str({ default: 'http://localhost:3000' }),

  // Asset Storage
  ASSET_STORAGE_ROOT: str({ docs: 'Absolute path to asset storage directory' }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 900_000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
  AUTH_RATE_LIMIT_MAX: num({ default: 10 }),

  // Logging
  LOG_LEVEL: str({
    choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    default: 'info',
  }),
});
