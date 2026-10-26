import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
} from './customer.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Customer API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listCustomers sends query parameters and returns paginated result', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            _id: 'cust-1',
            id: 'cust-1',
            name: 'John Doe',
            phone: '+1-555-0199',
            status: 'active',
            isDeleted: false,
          },
        ],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listCustomers({ page: 1, search: 'John' });

    expect(apiClient.get).toHaveBeenCalledWith('/customers', {
      params: { page: 1, search: 'John' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('John Doe');
    expect(result.meta.pagination.total).toBe(1);
  });

  it('getCustomer fetches customer by id', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cust-1', name: 'John Doe', phone: '+1-555-0199' } },
    });

    const result = await getCustomer('cust-1');

    expect(apiClient.get).toHaveBeenCalledWith('/customers/cust-1');
    expect(result.name).toBe('John Doe');
  });

  it('createCustomer posts payload', async () => {
    const payload = {
      name: 'Jane Smith',
      phone: '+1-555-0200',
      status: 'active' as const,
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cust-2', ...payload } },
    });

    const result = await createCustomer(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/customers', payload);
    expect(result._id).toBe('cust-2');
  });

  it('updateCustomer patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cust-1', address: 'Updated Address' } },
    });

    const result = await updateCustomer('cust-1', { address: 'Updated Address' });

    expect(apiClient.patch).toHaveBeenCalledWith('/customers/cust-1', { address: 'Updated Address' });
    expect(result._id).toBe('cust-1');
  });

  it('deleteCustomer calls delete endpoint', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteCustomer('cust-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/customers/cust-1');
  });

  it('restoreCustomer calls restore endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'cust-1', isDeleted: false } },
    });

    const result = await restoreCustomer('cust-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/customers/cust-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
