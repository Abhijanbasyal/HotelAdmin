import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listCategories,
  getActiveCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
} from './category.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Category API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listCategories sends parameters and returns paginated data', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [{ _id: 'cat-1', name: 'Beverages', status: 'active', isDeleted: false }],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listCategories({ page: 1, search: 'Bev' });

    expect(apiClient.get).toHaveBeenCalledWith('/categories', {
      params: { page: 1, search: 'Bev' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Beverages');
    expect(result.meta.pagination.total).toBe(1);
  });

  it('getActiveCategories fetches active dropdown items', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [{ _id: 'cat-1', name: 'Beverages' }],
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await getActiveCategories();

    expect(apiClient.get).toHaveBeenCalledWith('/categories/active');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Beverages');
  });

  it('getCategory returns single category item', async () => {
    const mockCategory = { _id: 'cat-1', name: 'Food', status: 'active' };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockCategory },
    });

    const result = await getCategory('cat-1');

    expect(apiClient.get).toHaveBeenCalledWith('/categories/cat-1');
    expect(result.name).toBe('Food');
  });

  it('createCategory posts payload and returns created item', async () => {
    const payload = { name: 'Desserts', status: 'active' as const };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cat-2', ...payload } },
    });

    const result = await createCategory(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/categories', payload);
    expect(result._id).toBe('cat-2');
    expect(result.name).toBe('Desserts');
  });

  it('updateCategory patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cat-1', name: 'Updated Name' } },
    });

    const result = await updateCategory('cat-1', { name: 'Updated Name' });

    expect(apiClient.patch).toHaveBeenCalledWith('/categories/cat-1', { name: 'Updated Name' });
    expect(result.name).toBe('Updated Name');
  });

  it('deleteCategory sends delete request', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteCategory('cat-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/categories/cat-1');
  });

  it('restoreCategory sends patch request to /restore', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cat-1', isDeleted: false } },
    });

    const result = await restoreCategory('cat-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/categories/cat-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
