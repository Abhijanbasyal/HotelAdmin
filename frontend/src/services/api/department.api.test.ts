import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listDepartments,
  getActiveDepartments,
  createDepartment,
  deleteDepartment,
  restoreDepartment,
} from './department.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Department API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listDepartments queries departments with pagination', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [{ _id: 'dept-1', name: 'Kitchen', code: 'KIT', status: 'active' }],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listDepartments({ page: 1 });

    expect(apiClient.get).toHaveBeenCalledWith('/departments', {
      params: { page: 1 },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].code).toBe('KIT');
  });

  it('getActiveDepartments returns active list', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [{ _id: 'dept-1', name: 'Kitchen', code: 'KIT' }] },
    });

    const result = await getActiveDepartments();

    expect(apiClient.get).toHaveBeenCalledWith('/departments/active');
    expect(result).toHaveLength(1);
  });

  it('createDepartment posts creation payload', async () => {
    const payload = { name: 'Front Desk', code: 'FD' };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'dept-2', ...payload } },
    });

    const result = await createDepartment(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/departments', payload);
    expect(result._id).toBe('dept-2');
  });

  it('deleteDepartment calls delete endpoint', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteDepartment('dept-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/departments/dept-1');
  });

  it('restoreDepartment calls restore endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'dept-1', isDeleted: false } },
    });

    const result = await restoreDepartment('dept-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/departments/dept-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
