import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
} from './product.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Product API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listProducts sends query parameters and extracts meta pagination', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            _id: 'prod-1',
            id: 'prod-1',
            name: 'Coffee',
            sku: 'BEV-COF',
            price: 4.5,
            stockQuantity: 20,
            category: 'cat-1',
            images: [],
            isAvailable: true,
            isDeleted: false,
          },
        ],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listProducts({ page: 1, search: 'Coffee' });

    expect(apiClient.get).toHaveBeenCalledWith('/products', {
      params: { page: 1, search: 'Coffee' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Coffee');
    expect(result.meta.pagination.total).toBe(1);
  });

  it('getProduct fetches product by id', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'prod-1', name: 'Coffee', sku: 'BEV-01' } },
    });

    const result = await getProduct('prod-1');

    expect(apiClient.get).toHaveBeenCalledWith('/products/prod-1');
    expect(result.sku).toBe('BEV-01');
  });

  it('createProduct posts creation payload', async () => {
    const payload = {
      name: 'Burger',
      sku: 'FOD-BUR',
      category: 'cat-1',
      price: 12.99,
      stockQuantity: 15,
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'prod-2', ...payload } },
    });

    const result = await createProduct(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/products', payload);
    expect(result._id).toBe('prod-2');
  });

  it('updateProduct patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'prod-1', price: 14.5 } },
    });

    const result = await updateProduct('prod-1', { price: 14.5 });

    expect(apiClient.patch).toHaveBeenCalledWith('/products/prod-1', { price: 14.5 });
    expect(result.price).toBe(14.5);
  });

  it('deleteProduct sends delete request', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteProduct('prod-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/products/prod-1');
  });

  it('restoreProduct sends patch request to /restore', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'prod-1', isDeleted: false } },
    });

    const result = await restoreProduct('prod-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/products/prod-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
