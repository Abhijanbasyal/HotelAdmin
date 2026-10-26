import type { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) in non-production
    if (!origin && env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true, // Required for HttpOnly refresh-token cookies
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-Id'],
  maxAge: 86_400, // 24 h preflight cache
};
