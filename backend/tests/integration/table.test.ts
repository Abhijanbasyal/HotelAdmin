import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Table } from '@/models/Table.model';

describe('Table API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testTableId: string;

  beforeAll(async () => {
    await connectDatabase();
    await Table.deleteMany({ tableNumber: { $regex: /^TableTest_/i } });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;
  });

  afterAll(async () => {
    await Table.deleteMany({ tableNumber: { $regex: /^TableTest_/i } });
    await disconnectDatabase();
  });

  it('creates a table with valid parameters', async () => {
    const res = await request(app)
      .post('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableNumber: 'TableTest_T101',
        capacity: 4,
        location: 'indoor',
        status: 'available',
        description: 'Cozy table near the fountain',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tableNumber).toBe('TABLETEST_T101');
    expect(res.body.data.capacity).toBe(4);
    expect(res.body.data.location).toBe('indoor');
    expect(res.body.data.status).toBe('available');
    expect(res.body.data.isDeleted).toBe(false);

    testTableId = res.body.data._id as string;
  });

  it('rejects duplicate table number', async () => {
    const res = await request(app)
      .post('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableNumber: 'TableTest_T101',
        capacity: 2,
        location: 'outdoor',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid capacity (< 1)', async () => {
    const res = await request(app)
      .post('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableNumber: 'TableTest_InvalidCap',
        capacity: 0,
        location: 'indoor',
      });

    expect(res.status).toBe(422);
  });

  it('retrieves active tables list', async () => {
    const res = await request(app)
      .get('/api/v1/tables/active?minCapacity=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.some((t: { _id: string }) => t._id === testTableId);
    expect(found).toBe(true);
  });

  it('retrieves paginated tables', async () => {
    const res = await request(app)
      .get('/api/v1/tables?search=TableTest_T101')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('retrieves table by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(testTableId);
  });

  it('updates table capacity and status', async () => {
    const res = await request(app)
      .patch(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        capacity: 6,
        status: 'occupied',
        description: 'Updated description',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.capacity).toBe(6);
    expect(res.body.data.status).toBe('occupied');
  });

  it('soft-deletes a table', async () => {
    const res = await request(app)
      .delete(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);
  });

  it('restores a soft-deleted table', async () => {
    const res = await request(app)
      .patch(`/api/v1/tables/${testTableId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/tables/${testTableId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
  });
});
