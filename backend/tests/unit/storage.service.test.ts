import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { LocalStorageService } from '@/services/storage.service';
import { AppError } from '@/utils/AppError';

describe('LocalStorageService Unit Tests', () => {
  const testStorageDir = path.resolve(__dirname, '../fixtures/storage_test');
  const service = new LocalStorageService(testStorageDir);

  beforeAll(async () => {
    await fs.promises.mkdir(testStorageDir, { recursive: true });
  });

  afterAll(async () => {
    if (fs.existsSync(testStorageDir)) {
      await fs.promises.rm(testStorageDir, { recursive: true, force: true });
    }
  });

  it('rejects path traversal attacks with an AppError', () => {
    expect(() => {
      service.resolveSafePath('../../windows/system32/cmd.exe');
    }).toThrow(AppError);

    expect(() => {
      service.resolveSafePath('..\\..\\secret.txt');
    }).toThrow(AppError);
  });

  it('resolves safe relative path within storage root', () => {
    const resolved = service.resolveSafePath('images/products/photo.jpg');
    expect(resolved.startsWith(testStorageDir)).toBe(true);
    expect(resolved.endsWith('photo.jpg')).toBe(true);
  });

  it('saves file buffer and reads back stats', async () => {
    const buffer = Buffer.from('hello hotel admin asset storage');
    const result = await service.saveFile(buffer, 'images/general', 'sample.txt', 'text/plain');

    expect(result.storageKey).toContain('images/general');
    expect(result.fileSize).toBe(buffer.length);
    expect(fs.existsSync(result.fullPath)).toBe(true);

    const stats = await service.getFileStats(result.storageKey);
    expect(stats).not.toBeNull();
    expect(stats?.size).toBe(buffer.length);

    // Delete file
    const deleted = await service.deleteFile(result.storageKey);
    expect(deleted).toBe(true);
    expect(fs.existsSync(result.fullPath)).toBe(false);
  });

  it('reports availability as true when storage directory is accessible', async () => {
    const available = await service.isAvailable();
    expect(available).toBe(true);
  });
});
