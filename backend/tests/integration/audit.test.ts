import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { AuditService } from '@/services/audit.service';
import { AuditLog } from '@/models/AuditLog.model';

describe('Audit Logging API Endpoints', () => {
  const app = createApp();
  let adminToken: string;

  beforeAll(async () => {
    await connectDatabase();

    // Authenticate as Super Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;
  });

  afterAll(async () => {
    // Clean up test audit logs
    await AuditLog.deleteMany({ entityType: 'TestEntity' });
    await disconnectDatabase();
  });

  it('rejects access to /api/v1/audit-logs without token', async () => {
    const res = await request(app).get('/api/v1/audit-logs');
    expect(res.status).toBe(401);
  });

  it('records an audit log and retrieves it via the API', async () => {
    // 1. Log event
    await AuditService.logEvent({
      action: 'TEST_ACTION',
      entityType: 'TestEntity',
      entityId: 'test-123',
      userEmail: 'admin@hoteladmin.com',
      details: { note: 'integration test verification' },
    });

    // 2. Fetch list
    const res = await request(app)
      .get('/api/v1/audit-logs?entityType=TestEntity')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const logItem = res.body.data.find((l: any) => l.action === 'TEST_ACTION');
    expect(logItem).toBeDefined();
    expect(logItem.entityType).toBe('TestEntity');
    expect(logItem.details.note).toBe('integration test verification');

    // 3. Verify pagination envelope
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.pagination).toBeDefined();
    expect(res.body.meta.pagination.page).toBe(1);
  });

  it('retrieves a single audit log by ID', async () => {
    const createdLog = await AuditLog.create({
      action: 'SINGLE_TEST',
      entityType: 'TestEntity',
      entityId: 'test-456',
      userEmail: 'admin@hoteladmin.com',
    });

    const res = await request(app)
      .get(`/api/v1/audit-logs/${createdLog._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.action).toBe('SINGLE_TEST');
  });

  it('validates ID param format and returns 422 for malformed ObjectId', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs/not-a-valid-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when audit log ID does not exist', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/v1/audit-logs/${nonExistentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
