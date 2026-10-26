import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '@/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Asset } from '@/models/Asset.model';
import { storageService } from '@/services/storage.service';

describe('Asset Management Endpoints', () => {
  const app = createApp();
  let adminToken: string;
  let samplePngBuffer: Buffer;

  beforeAll(async () => {
    await connectDatabase();
    await storageService.ensureDirectoryStructure();

    // Authenticate Super Admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@hoteladmin.com', password: 'Admin@123456' });

    adminToken = loginRes.body.data.accessToken as string;

    // Generate valid 20x20 test PNG in-memory
    samplePngBuffer = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 4,
        background: { r: 50, g: 120, b: 240, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  afterAll(async () => {
    // Clean up created test assets
    const testAssets = await Asset.find({ originalFilename: { $regex: /^test_/ } });
    for (const a of testAssets) {
      await storageService.deleteFile(a.storageKey);
    }
    await Asset.deleteMany({ originalFilename: { $regex: /^test_/ } });
    await disconnectDatabase();
  });

  it('rejects asset upload without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/assets/upload')
      .attach('file', samplePngBuffer, 'test_unauth.png');

    expect(res.status).toBe(401);
  });

  it('uploads a single image, extracts dimensions via Sharp, and stores metadata in MongoDB', async () => {
    const res = await request(app)
      .post('/api/v1/assets/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('entityType', 'Product')
      .field('visibility', 'public')
      .attach('file', samplePngBuffer, 'test_product.png');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.originalFilename).toBe('test_product.png');
    expect(res.body.data.entityType).toBe('Product');
    expect(res.body.data.mimeType).toBe('image/png');
    expect(res.body.data.imageWidth).toBe(20);
    expect(res.body.data.imageHeight).toBe(20);
    expect(res.body.data.storageKey).toMatch(/^images\/products\//);
    expect(res.body.data.url).toBe(`/api/v1/assets/file/${res.body.data.storageKey}`);
  });

  it('uploads multiple files concurrently', async () => {
    const res = await request(app)
      .post('/api/v1/assets/upload/multiple')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('entityType', 'General')
      .attach('files', samplePngBuffer, 'test_batch_1.png')
      .attach('files', samplePngBuffer, 'test_batch_2.png');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('lists assets with pagination and filters', async () => {
    const res = await request(app)
      .get('/api/v1/assets?entityType=Product')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta?.pagination).toBeDefined();
    expect(res.body.meta.pagination.page).toBe(1);
  });

  it('streams an image file for inline viewing by ID', async () => {
    // 1. Upload asset
    const uploadRes = await request(app)
      .post('/api/v1/assets/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('entityType', 'Category')
      .attach('file', samplePngBuffer, 'test_category.png');

    const assetId = uploadRes.body.data.id as string;
    const storageKey = uploadRes.body.data.storageKey as string;

    // 2. View by ID
    const viewRes = await request(app).get(`/api/v1/assets/${assetId}/view`);
    expect(viewRes.status).toBe(200);
    expect(viewRes.headers['content-type']).toBe('image/png');
    expect(viewRes.body).toBeInstanceOf(Buffer);

    // 3. View by static storage key
    const directRes = await request(app).get(`/api/v1/assets/file/${storageKey}`);
    expect(directRes.status).toBe(200);
    expect(directRes.headers['content-type']).toBe('image/png');
  });

  it('soft-deletes and restores an asset record', async () => {
    const uploadRes = await request(app)
      .post('/api/v1/assets/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', samplePngBuffer, 'test_delete_me.png');

    const assetId = uploadRes.body.data.id as string;

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/v1/assets/${assetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.isDeleted).toBe(true);

    // Restore
    const restoreRes = await request(app)
      .patch(`/api/v1/assets/${assetId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.isDeleted).toBe(false);
  });

  it('rejects disallowed file types like .exe', async () => {
    const exeBuffer = Buffer.from('MZfakeExecutableHeader');

    const res = await request(app)
      .post('/api/v1/assets/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', exeBuffer, 'test_malware.exe');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
