import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Category } from '@/models/Category.model';
import { Product } from '@/models/Product.model';

describe('Product API Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await connectDatabase();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;

    const cat = await Category.create({
      name: 'ProductTest_Category_Food',
      description: 'Test category for products',
      status: 'active',
    });
    testCategoryId = cat._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({ sku: { $regex: /^SKU-TEST/ } });
    await Category.deleteMany({ name: { $regex: /^ProductTest_/ } });
    await disconnectDatabase();
  });

  it('creates a product with valid category and fields', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Club Sandwich Deluxe',
        sku: 'SKU-TEST-001',
        description: 'Triple decker sandwich with fries',
        price: 18.5,
        costPrice: 6.0,
        stockQuantity: 40,
        category: testCategoryId,
        images: ['/api/v1/assets/file/images/products/sandwich.webp'],
        isAvailable: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe('SKU-TEST-001');
    expect(res.body.data.price).toBe(18.5);
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.category.name).toBe('ProductTest_Category_Food');
  });

  it('rejects product creation with duplicate SKU', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Another Sandwich',
        sku: 'SKU-TEST-001',
        price: 15.0,
        category: testCategoryId,
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('rejects product creation with non-existent or deleted category', async () => {
    const nonExistentCategoryId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ghost Product',
        sku: 'SKU-TEST-GHOST',
        price: 10.0,
        category: nonExistentCategoryId,
      });

    expect(res.status).toBe(400);
  });

  it('lists products with category, price range, and search filtering', async () => {
    const res = await request(app)
      .get(`/api/v1/products?category=${testCategoryId}&search=Deluxe&minPrice=10&maxPrice=25`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].sku).toBe('SKU-TEST-001');
    expect(res.body.meta?.pagination).toBeDefined();
  });

  it('updates product inventory and price', async () => {
    const prod = await Product.findOne({ sku: 'SKU-TEST-001' });
    expect(prod).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/products/${prod!._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 19.99,
        stockQuantity: 25,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(19.99);
    expect(res.body.data.stockQuantity).toBe(25);
  });

  it('soft-deletes and restores a product', async () => {
    const prod = await Product.create({
      name: 'Temporary Juice',
      sku: 'SKU-TEST-TEMP',
      price: 5.0,
      stockQuantity: 10,
      category: testCategoryId,
    });

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/products/${prod._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);

    // Restore
    const restoreRes = await request(app)
      .patch(`/api/v1/products/${prod._id.toString()}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);
  });
});
