import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Customer } from '@/models/Customer.model';

describe('Customer API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testCustomerId: string;

  beforeAll(async () => {
    await connectDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;
  });

  afterAll(async () => {
    await Customer.deleteMany({ name: { $regex: /^CustomerTest_/ } });
    await disconnectDatabase();
  });

  it('creates a customer with valid parameters', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CustomerTest_John Doe',
        email: 'customertest_john@example.com',
        phone: '+1-555-0199',
        address: '100 Ocean Drive, Suite 4',
        idType: 'passport',
        idNumber: 'PA1234567',
        notes: 'VIP Guest, prefers top floor',
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('CustomerTest_John Doe');
    expect(res.body.data.phone).toBe('+1-555-0199');
    expect(res.body.data.isDeleted).toBe(false);

    testCustomerId = res.body.data._id as string;
  });

  it('rejects duplicate customer phone', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CustomerTest_Another Name',
        phone: '+1-555-0199',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('lists customers with pagination and search filter', async () => {
    const res = await request(app)
      .get('/api/v1/customers?search=CustomerTest_John')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('retrieves single customer by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('CustomerTest_John Doe');
  });

  it('updates customer details', async () => {
    const res = await request(app)
      .patch(`/api/v1/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        address: '200 Ocean Blvd',
        notes: 'VIP Guest, requested late checkout',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.address).toBe('200 Ocean Blvd');
    expect(res.body.data.notes).toBe('VIP Guest, requested late checkout');
  });

  it('soft-deletes customer and prevents standard fetch', async () => {
    const deleteRes = await request(app)
      .delete(`/api/v1/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/v1/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });

  it('restores soft-deleted customer', async () => {
    const restoreRes = await request(app)
      .patch(`/api/v1/customers/${testCustomerId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);

    const getRes = await request(app)
      .get(`/api/v1/customers/${testCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('CustomerTest_John Doe');
  });
});
