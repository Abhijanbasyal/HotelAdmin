import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '@/middleware/validateRequest';
import { objectIdSchema } from '@/validators/common.validator';

describe('validateRequest Middleware', () => {
  it('validates single request part (body) and passes through', () => {
    const schema = z.object({
      name: z.string().min(2),
    });

    const req = { body: { name: 'Ocean View' } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    validateRequest(schema, 'body')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ocean View' });
  });

  it('passes ZodError to next handler when single part validation fails', () => {
    const schema = z.object({
      name: z.string().min(5),
    });

    const req = { body: { name: 'Hi' } } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    validateRequest(schema, 'body')(req, res, next);

    expect(next).toHaveBeenCalled();
    const errorArg = (next as any).mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(z.ZodError);
  });

  it('supports multi-part validation (params + query + body)', () => {
    const req = {
      params: { id: '507f1f77bcf86cd799439011' },
      query: { page: '2' },
      body: { name: 'Presidential Suite' },
    } as unknown as Request;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({
      params: z.object({ id: objectIdSchema }),
      query: z.object({ page: z.string().transform(Number) }),
      body: z.object({ name: z.string() }),
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req.query as any).page).toBe(2);
    expect((req.body as any).name).toBe('Presidential Suite');
  });

  it('fails multi-part validation if any part is invalid', () => {
    const req = {
      params: { id: 'invalid-not-hex' },
      query: {},
      body: { name: 'Suite' },
    } as unknown as Request;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const middleware = validateRequest({
      params: z.object({ id: objectIdSchema }),
      body: z.object({ name: z.string() }),
    });

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const errorArg = (next as any).mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(z.ZodError);
  });
});
