import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

export interface IStorageProvider {
  saveFile(
    buffer: Buffer,
    subDirectory: string,
    originalFilename: string,
    mimeType: string
  ): Promise<{ storageKey: string; fullPath: string; fileSize: number }>;
  getFileStream(storageKey: string): fs.ReadStream;
  deleteFile(storageKey: string): Promise<boolean>;
  isAvailable(): Promise<boolean>;
  getFileStats(storageKey: string): Promise<fs.Stats | null>;
}

export class LocalStorageService implements IStorageProvider {
  private readonly storageRoot: string;

  constructor(storageRoot: string = env.ASSET_STORAGE_ROOT) {
    this.storageRoot = path.resolve(storageRoot);
  }

  /**
   * Initializes and ensures standard storage subdirectories exist.
   */
  async ensureDirectoryStructure(): Promise<void> {
    const requiredDirs = [
      'images/products',
      'images/users',
      'images/customers',
      'images/staff',
      'images/categories',
      'images/general',
      'videos/products',
      'videos/users',
      'videos/general',
      'files/documents',
      'files/invoices',
      'files/reports',
      'files/general',
    ];

    try {
      for (const dir of requiredDirs) {
        const fullPath = path.join(this.storageRoot, dir);
        await fs.promises.mkdir(fullPath, { recursive: true });
      }
      logger.info({ storageRoot: this.storageRoot }, 'Asset storage directory structure verified');
    } catch (err) {
      logger.error({ err, storageRoot: this.storageRoot }, 'Failed to initialize asset storage directories');
      throw AppError.internal('Asset storage device is unavailable or not writable');
    }
  }

  /**
   * Resolves a storage key to an absolute path with strict path-traversal protection.
   */
  resolveSafePath(storageKey: string): string {
    // Normalize path separators to current OS
    const sanitizedKey = storageKey.replace(/^[/\\]+/, '');
    const absolutePath = path.resolve(this.storageRoot, sanitizedKey);

    // Prevent path traversal attacks (e.g. ../../etc/passwd)
    const relative = path.relative(this.storageRoot, absolutePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw AppError.badRequest('Invalid storage key: directory traversal attempt detected');
    }

    return absolutePath;
  }

  /**
   * Writes a file buffer to the dedicated local storage filesystem.
   */
  async saveFile(
    buffer: Buffer,
    subDirectory: string,
    originalFilename: string,
    _mimeType: string
  ): Promise<{ storageKey: string; fullPath: string; fileSize: number }> {
    const available = await this.isAvailable();
    if (!available) {
      throw new AppError(
        'Asset storage device is currently offline or unreachable.',
        503,
        'STORAGE_UNAVAILABLE'
      );
    }

    // Extract and sanitize extension
    const parsedExt = path.extname(originalFilename).toLowerCase();
    const safeExt = parsedExt.replace(/[^a-z0-9_.]/g, '');

    // Generate unique, collision-proof filename
    const uniqueName = `${nanoid(16)}_${Date.now()}${safeExt}`;
    const storageKey = path.join(subDirectory, uniqueName).replace(/\\/g, '/');
    const fullPath = this.resolveSafePath(storageKey);

    // Ensure target folder exists
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

    // Write binary file to disk
    await fs.promises.writeFile(fullPath, buffer);

    return {
      storageKey,
      fullPath,
      fileSize: buffer.length,
    };
  }

  /**
   * Returns a readable stream to pipe binary files to HTTP clients.
   */
  getFileStream(storageKey: string): fs.ReadStream {
    const fullPath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(fullPath)) {
      throw AppError.notFound('Asset file not found on storage device');
    }

    return fs.createReadStream(fullPath);
  }

  /**
   * Deletes a physical file from the storage device.
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error({ err, storageKey }, 'Error deleting file from storage');
      return false;
    }
  }

  /**
   * Checks whether the configured storage path exists and is writable.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await fs.promises.access(this.storageRoot, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns file metadata from disk.
   */
  async getFileStats(storageKey: string): Promise<fs.Stats | null> {
    try {
      const fullPath = this.resolveSafePath(storageKey);
      return await fs.promises.stat(fullPath);
    } catch {
      return null;
    }
  }
}

// Singleton storage service instance
export const storageService = new LocalStorageService();
