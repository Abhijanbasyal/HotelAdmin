import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';

describe('Dashboard API Endpoints', () => {
  const app = createApp();
  let adminToken: string;

  beforeAll(async () => {
    await connectDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('rejects unauthenticated requests to dashboard endpoints', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).toBe(401);
  });

  it('retrieves high-level dashboard summary KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalProducts');
    expect(res.body.data).toHaveProperty('totalCategories');
    expect(res.body.data).toHaveProperty('totalTables');
    expect(res.body.data).toHaveProperty('availableTables');
    expect(res.body.data).toHaveProperty('occupiedTables');
    expect(res.body.data).toHaveProperty('occupancyRate');
    expect(res.body.data).toHaveProperty('totalCustomers');
    expect(res.body.data).toHaveProperty('totalStaff');
    expect(res.body.data).toHaveProperty('totalBookings');
    expect(res.body.data).toHaveProperty('todayBookings');
    expect(typeof res.body.data.occupancyRate).toBe('number');
  });

  it('retrieves booking trends timeline', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/trends?days=7')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(7);

    const firstDay = res.body.data[0];
    expect(firstDay).toHaveProperty('date');
    expect(firstDay).toHaveProperty('confirmed');
    expect(firstDay).toHaveProperty('seated');
    expect(firstDay).toHaveProperty('completed');
    expect(firstDay).toHaveProperty('cancelled');
    expect(firstDay).toHaveProperty('total');
  });

  it('retrieves real-time floor occupancy and location breakdown', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/occupancy')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('byStatus');
    expect(res.body.data.byStatus).toHaveProperty('available');
    expect(res.body.data.byStatus).toHaveProperty('occupied');
    expect(res.body.data.byStatus).toHaveProperty('reserved');
    expect(res.body.data.byStatus).toHaveProperty('maintenance');
    expect(res.body.data).toHaveProperty('byLocation');
    expect(res.body.data).toHaveProperty('totalCapacity');
    expect(res.body.data).toHaveProperty('occupancyPercentage');
  });

  it('retrieves recent operational activities (bookings & audit logs)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/recent')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('recentBookings');
    expect(res.body.data).toHaveProperty('recentAuditLogs');
    expect(Array.isArray(res.body.data.recentBookings)).toBe(true);
    expect(Array.isArray(res.body.data.recentAuditLogs)).toBe(true);
  });
});
