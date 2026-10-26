import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';

describe('Auth API Endpoints', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('rejects login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('successfully logs in with valid credentials and sets HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@hoteladmin.com');
    expect(res.body.data.accessToken).toBeTruthy();

    // Check HttpOnly refresh token cookie
    const cookies = res.headers['set-cookie'] as string[] | undefined;
    expect(cookies).toBeDefined();
    expect(cookies?.some((c) => c.includes('refreshToken='))).toBe(true);
    expect(cookies?.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('protects /api/v1/auth/me against unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('allows access to /api/v1/auth/me with a valid Bearer token', async () => {
    // 1. Log in to get access token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    const accessToken = loginRes.body.data.accessToken as string;

    // 2. Access /me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('admin@hoteladmin.com');
    expect(meRes.body.data.role).toBe('Super Admin');
  });
});
