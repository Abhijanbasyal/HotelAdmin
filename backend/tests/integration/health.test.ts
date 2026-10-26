import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';

describe('Health Check API Endpoints', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /health returns healthy status and database connection details', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.status).toBe('connected');
    expect(res.body.database.readyState).toBe(1);
    expect(typeof res.body.database.pingMs).toBe('number');
  });

  it('GET /api/v1/health returns API versioned database health', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database.status).toBe('connected');
  });
});
