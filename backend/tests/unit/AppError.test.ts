import { describe, it, expect } from 'vitest';
import { AppError } from '@/utils/AppError';

describe('AppError', () => {
  it('creates an AppError instance with correct properties', () => {
    const error = new AppError('Something failed', 400, 'BAD_REQUEST', { field: 'name' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Something failed');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.details).toEqual({ field: 'name' });
    expect(error.isOperational).toBe(true);
  });

  it('provides static factory helpers', () => {
    const badReq = AppError.badRequest('Invalid input');
    expect(badReq.statusCode).toBe(400);
    expect(badReq.code).toBe('BAD_REQUEST');

    const unauthorized = AppError.unauthorized();
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.code).toBe('UNAUTHORIZED');

    const forbidden = AppError.forbidden();
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.code).toBe('FORBIDDEN');

    const notFound = AppError.notFound('Product');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe('NOT_FOUND');
    expect(notFound.message).toBe('Product not found');

    const conflict = AppError.conflict('Already exists');
    expect(conflict.statusCode).toBe(409);
    expect(conflict.code).toBe('CONFLICT');
  });
});
