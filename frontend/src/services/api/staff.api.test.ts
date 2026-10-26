import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  restoreStaff,
  getActiveRoles,
} from './staff.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Staff API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listStaff queries staff with pagination', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            _id: 'staff-1',
            id: 'staff-1',
            name: 'Alice',
            email: 'alice@hoteladmin.com',
            role: { _id: 'r-1', name: 'Receptionist' },
            isActive: true,
            isDeleted: false,
          },
        ],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listStaff({ page: 1, role: 'r-1' });

    expect(apiClient.get).toHaveBeenCalledWith('/staff', {
      params: { page: 1, role: 'r-1' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].email).toBe('alice@hoteladmin.com');
  });

  it('getActiveRoles returns list of roles', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [{ _id: 'r-1', name: 'Receptionist' }] },
    });

    const result = await getActiveRoles();

    expect(apiClient.get).toHaveBeenCalledWith('/staff/roles');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Receptionist');
  });

  it('getStaff fetches single staff item', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'staff-1', name: 'Alice' } },
    });

    const result = await getStaff('staff-1');

    expect(apiClient.get).toHaveBeenCalledWith('/staff/staff-1');
    expect(result.name).toBe('Alice');
  });

  it('createStaff posts creation payload', async () => {
    const payload = {
      name: 'Bob',
      email: 'bob@hoteladmin.com',
      password: 'Password@123',
      role: 'r-2',
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'staff-2', ...payload } },
    });

    const result = await createStaff(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/staff', payload);
    expect(result._id).toBe('staff-2');
  });

  it('updateStaff patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'staff-1', jobTitle: 'Manager' } },
    });

    const result = await updateStaff('staff-1', { jobTitle: 'Manager' });

    expect(apiClient.patch).toHaveBeenCalledWith('/staff/staff-1', { jobTitle: 'Manager' });
    expect(result._id).toBe('staff-1');
  });

  it('deleteStaff calls delete endpoint', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteStaff('staff-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/staff/staff-1');
  });

  it('restoreStaff calls restore endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'staff-1', isDeleted: false } },
    });

    const result = await restoreStaff('staff-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/staff/staff-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
