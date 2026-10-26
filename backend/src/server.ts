import 'dotenv/config';
import { env } from '@/config/env';
import { createApp } from './app';
import { connectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';

const PORT = env.PORT;

async function start(): Promise<void> {
  try {
    // Connect to MongoDB before accepting traffic
    await connectDatabase();

    // Verify and ensure local asset storage directory structure
    const { storageService } = await import('@/services/storage.service');
    await storageService.ensureDirectoryStructure();

    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          env: env.NODE_ENV,
          api: `/api/${env.API_VERSION}`,
        },
        '🏨 Hotel Management API server started'
      );
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = (signal: string): void => {
      logger.info({ signal }, 'Shutdown signal received');
      server.close(() => {
        logger.info('HTTP server closed');
        void (async () => {
          try {
            const { disconnectDatabase } = await import('@/config/database');
            await disconnectDatabase();
          } catch (error) {
            logger.error({ error }, 'Error disconnecting database');
          } finally {
            process.exit(0);
          }
        })();
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => { shutdown('SIGTERM'); });
    process.on('SIGINT', () => { shutdown('SIGINT'); });

    // ── Unhandled errors ─────────────────────────────────────────────────────
    process.on('unhandledRejection', (reason) => {
      logger.fatal({ reason }, 'Unhandled promise rejection');
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught exception');
      process.exit(1);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void start();
