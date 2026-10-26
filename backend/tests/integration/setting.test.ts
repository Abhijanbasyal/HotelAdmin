import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Setting } from '@/models/Setting.model';

describe('Setting API Endpoints', () => {
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
    // Reset hotel name to default
    await Setting.updateOne({}, { hotelName: 'Grand Palace Hotel & Resort' });
    await disconnectDatabase();
  });

  it('retrieves the hotel and system settings', async () => {
    const res = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hotelName).toBeDefined();
    expect(res.body.data.currency).toBeDefined();
    expect(res.body.data.checkInTime).toBeDefined();
  });

  it('updates hotel settings and operations configuration', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        hotelName: 'Royal Palm Luxury Resort',
        tagline: 'World-Class Comfort',
        currency: 'USD',
        currencySymbol: '$',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        taxRate: 12,
        serviceChargeRate: 7,
        theme: 'dark',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hotelName).toBe('Royal Palm Luxury Resort');
    expect(res.body.data.checkInTime).toBe('15:00');
    expect(res.body.data.taxRate).toBe(12);
    expect(res.body.data.theme).toBe('dark');

    // Verify persistence with a subsequent GET
    const getRes = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.hotelName).toBe('Royal Palm Luxury Resort');
  });

  it('rejects invalid check-in time format', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        checkInTime: '25:99',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejects tax rate exceeding 100%', async () => {
    const res = await request(app)
      .patch('/api/v1/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        taxRate: 150,
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});
