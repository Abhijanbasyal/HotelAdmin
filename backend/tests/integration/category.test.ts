import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Category } from '@/models/Category.model';
import { Product } from '@/models/Product.model';

describe('Category API Endpoints', () => {
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
    await Product.deleteMany({ name: { $regex: /^CategoryTest_/ } });
    await Category.deleteMany({ name: { $regex: /^CategoryTest_/ } });
    await disconnectDatabase();
  });

  it('creates a category with valid parameters', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CategoryTest_Beverages',
        description: 'Refreshing hot and cold drinks',
        status: 'active',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('CategoryTest_Beverages');
    expect(res.body.data.isDeleted).toBe(false);
  });

  it('rejects duplicate category names', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'CategoryTest_Beverages',
        description: 'Duplicate beverage category',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('lists categories with pagination and computed product counts', async () => {
    const res = await request(app)
      .get('/api/v1/categories?search=CategoryTest_Beverages')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].productCount).toBeDefined();
    expect(res.body.meta?.pagination).toBeDefined();
  });

  it('updates category details', async () => {
    const cat = await Category.findOne({ name: 'CategoryTest_Beverages' });
    expect(cat).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/categories/${cat!._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Updated beverage description',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated beverage description');
  });

  it('soft-deletes and restores a category', async () => {
    const tempCat = await Category.create({
      name: 'CategoryTest_Desserts',
      description: 'Sweet treats',
      status: 'active',
    });

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/categories/${tempCat._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);

    // Excluded from standard listing
    const listRes = await request(app)
      .get('/api/v1/categories?search=CategoryTest_Desserts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.body.data.length).toBe(0);

    // Restore
    const restoreRes = await request(app)
      .patch(`/api/v1/categories/${tempCat._id.toString()}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);
  });
});
