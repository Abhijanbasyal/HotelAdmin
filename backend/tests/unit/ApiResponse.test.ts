import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { ApiResponse } from '@/utils/ApiResponse';

describe('ApiResponse Utility', () => {
  const createMockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
  };

  it('formats standard success response', () => {
    const res = createMockResponse();
    const data = { id: '123', name: 'Deluxe Suite' };

    ApiResponse.success(res, data, 'Item retrieved');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Item retrieved',
      data,
    });
  });

  it('formats created response with 201 status', () => {
    const res = createMockResponse();
    const data = { id: '456' };

    ApiResponse.created(res, data, 'Category created');

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Category created',
      data,
    });
  });

  it('formats paginated response with standardized pagination meta', () => {
    const res = createMockResponse();
    const data = [{ id: '1' }, { id: '2' }];
    const pagination = {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    ApiResponse.paginated(res, data, pagination, 'Items listed');

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Items listed',
      data,
      meta: {
        pagination,
      },
    });
  });

  it('formats 204 noContent response', () => {
    const res = createMockResponse();

    ApiResponse.noContent(res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
