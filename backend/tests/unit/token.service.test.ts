import { describe, it, expect } from 'vitest';
import { generateAccessToken, verifyAccessToken } from '@/services/token.service';

describe('token.service', () => {
  it('generates a valid JWT access token and decodes it correctly', async () => {
    const payload = {
      userId: '60d0fe4f5311236168a109ca',
      email: 'admin@hoteladmin.com',
      role: 'Super Admin',
      permissions: ['*'],
    };

    const token = await generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = await verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.permissions).toEqual(['*']);
  });

  it('rejects an invalid or tampered access token', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    await expect(verifyAccessToken(invalidToken)).rejects.toThrow();
  });
});
