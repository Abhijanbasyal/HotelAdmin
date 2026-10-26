import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Department } from '@/models/Department.model';

describe('Department API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testDeptId: string;

  beforeAll(async () => {
    await connectDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;
  });

  afterAll(async () => {
    await Department.deleteMany({ name: { $regex: /^DeptTest_/ } });
    await disconnectDatabase();
  });

  it('creates a department with valid parameters', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'DeptTest_Housekeeping',
        code: 'DTHK',
        description: 'Room cleaning and linens management',
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('DeptTest_Housekeeping');
    expect(res.body.data.code).toBe('DTHK');

    testDeptId = res.body.data._id as string;
  });

  it('rejects duplicate department name or code', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'DeptTest_Housekeeping',
        code: 'NEWCODE',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('lists active departments for dropdown selectors', async () => {
    const res = await request(app)
      .get('/api/v1/departments/active')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]._id).toBeDefined();
    expect(res.body.data[0].name).toBeDefined();
  });

  it('updates department details', async () => {
    const res = await request(app)
      .patch(`/api/v1/departments/${testDeptId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Updated room cleaning and sanitization',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated room cleaning and sanitization');
  });

  it('soft-deletes department without active staff', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/departments/${testDeptId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);
  });

  it('restores soft-deleted department', async () => {
    const restoreRes = await request(app)
      .patch(`/api/v1/departments/${testDeptId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);
  });
});
