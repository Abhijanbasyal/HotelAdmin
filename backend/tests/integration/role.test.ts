import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Role } from '@/models/Role.model';

describe('Role API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testRoleId: string;

  beforeAll(async () => {
    await connectDatabase();
    await Role.deleteMany({ name: { $regex: /^RoleTest_/i } });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;
  });

  afterAll(async () => {
    await Role.deleteMany({ name: { $regex: /^RoleTest_/i } });
    await disconnectDatabase();
  });

  it('retrieves the full list of available system permissions', async () => {
    const res = await request(app)
      .get('/api/v1/roles/permissions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
    const hasProductsRead = res.body.data.some((p: { id: string }) => p.id === 'products.read');
    expect(hasProductsRead).toBe(true);
  });

  it('creates a custom role with valid parameters', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'RoleTest_Night Auditor',
        description: 'Performs nightly audit and balance reconciliations',
        permissions: ['audit.read', 'bookings.read', 'customers.read'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('RoleTest_Night Auditor');
    expect(res.body.data.isSystem).toBe(false);
    expect(res.body.data.permissions).toContain('audit.read');

    testRoleId = res.body.data._id as string;
  });

  it('rejects duplicate role name', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'RoleTest_Night Auditor',
        permissions: ['audit.read'],
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('retrieves active roles list', async () => {
    const res = await request(app)
      .get('/api/v1/roles/active')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.some((r: { _id: string }) => r._id === testRoleId);
    expect(found).toBe(true);
  });

  it('retrieves paginated roles with search', async () => {
    const res = await request(app)
      .get('/api/v1/roles?search=RoleTest_Night')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('retrieves role by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/roles/${testRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(testRoleId);
  });

  it('updates role permissions and description', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${testRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Updated night auditor role description',
        permissions: ['audit.read', 'bookings.read', 'tables.read'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Updated night auditor role description');
    expect(res.body.data.permissions).toContain('tables.read');
  });

  it('prevents soft-deleting a system role', async () => {
    const managerRole = await Role.findOne({ name: 'Hotel Manager', isSystem: true });
    expect(managerRole).toBeDefined();

    const res = await request(app)
      .delete(`/api/v1/roles/${managerRole!._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('cannot be deleted');
  });

  it('soft-deletes a custom role', async () => {
    const res = await request(app)
      .delete(`/api/v1/roles/${testRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/roles/${testRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(404);
  });

  it('restores a soft-deleted custom role', async () => {
    const res = await request(app)
      .patch(`/api/v1/roles/${testRoleId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/roles/${testRoleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
  });
});
