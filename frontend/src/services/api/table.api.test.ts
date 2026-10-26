import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listTables,
  getActiveTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  restoreTable,
} from './table.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Table API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listTables sends query parameters and returns paginated result', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            _id: 'table-1',
            id: 'table-1',
            tableNumber: 'T-01',
            capacity: 4,
            location: 'indoor',
            status: 'available',
            isDeleted: false,
          },
        ],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listTables({ page: 1, location: 'indoor' });

    expect(apiClient.get).toHaveBeenCalledWith('/tables', {
      params: { page: 1, location: 'indoor' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].tableNumber).toBe('T-01');
    expect(result.meta.pagination.total).toBe(1);
  });

  it('getActiveTables fetches active tables with minCapacity filter', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ _id: 'table-1', tableNumber: 'T-01', capacity: 6, status: 'available' }],
      },
    });

    const result = await getActiveTables(4);

    expect(apiClient.get).toHaveBeenCalledWith('/tables/active', {
      params: { minCapacity: 4 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].capacity).toBe(6);
  });

  it('getTable fetches table by id', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'table-1', tableNumber: 'T-01' } },
    });

    const result = await getTable('table-1');

    expect(apiClient.get).toHaveBeenCalledWith('/tables/table-1');
    expect(result.tableNumber).toBe('T-01');
  });

  it('createTable posts payload', async () => {
    const payload = {
      tableNumber: 'T-02',
      capacity: 2,
      location: 'outdoor' as const,
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'table-2', ...payload } },
    });

    const result = await createTable(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/tables', payload);
    expect(result._id).toBe('table-2');
  });

  it('updateTable patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'table-1', capacity: 6 } },
    });

    const result = await updateTable('table-1', { capacity: 6 });

    expect(apiClient.patch).toHaveBeenCalledWith('/tables/table-1', { capacity: 6 });
    expect(result._id).toBe('table-1');
  });

  it('deleteTable calls delete endpoint', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteTable('table-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/tables/table-1');
  });

  it('restoreTable calls restore endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'table-1', isDeleted: false } },
    });

    const result = await restoreTable('table-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/tables/table-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
