import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '@/utils/logger';

let isConnected = false;

export interface DatabaseHealth {
  status: 'disconnected' | 'connected' | 'connecting' | 'disconnecting';
  readyState: number;
  host?: string;
  name?: string;
  pingMs?: number;
}

export async function connectDatabase(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    logger.debug('Using existing MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 10_000,
    });

    isConnected = true;
    logger.info({ uri: env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') }, 'MongoDB connected');

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB');
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected && mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const states: Array<'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = [
    'disconnected',
    'connected',
    'connecting',
    'disconnecting',
  ];
  const readyState = mongoose.connection.readyState;
  const status = states[readyState] ?? 'disconnected';

  let pingMs: number | undefined;
  if (readyState === mongoose.ConnectionStates.connected && mongoose.connection.db) {
    const start = performance.now();
    try {
      await mongoose.connection.db.admin().ping();
      pingMs = Math.round(performance.now() - start);
    } catch {
      pingMs = undefined;
    }
  }

  return {
    status,
    readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    pingMs,
  };
}

/**
 * Execute an operation within a MongoDB transaction.
 * In environments where MongoDB is not configured as a replica set (e.g. standard local dev),
 * it gracefully falls back to executing the operation without a transaction.
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    try {
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      return result!;
    } catch (txErr: unknown) {
      const msg = txErr instanceof Error ? txErr.message : String(txErr);
      if (msg.includes('Transaction numbers are only allowed on a replica set member')) {
        logger.warn('Standalone MongoDB detected: executing operation without multi-document transaction');
        return await operation(null);
      }
      throw txErr;
    }
  } finally {
    await session.endSession();
  }
}
