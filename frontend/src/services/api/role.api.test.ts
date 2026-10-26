import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listRoles,
  getActiveRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  restoreRole,
  getAvailablePermissions,
} from './role.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Role API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAvailablePermissions retrieves permissions list', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [{ id: 'roles.read', label: 'View Roles', module: 'Roles' }] },
    });

    const perms = await getAvailablePermissions();

    expect(apiClient.get).toHaveBeenCalledWith('/roles/permissions');
    expect(perms).toHaveLength(1);
    expect(perms[0].id).toBe('roles.read');
  });

  it('listRoles sends query parameters and returns paginated result', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            _id: 'r-1',
            id: 'r-1',
            name: 'Concierge',
            isSystem: false,
            permissions: ['bookings.read'],
            isDeleted: false,
          },
        ],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listRoles({ page: 1, search: 'Concierge' });

    expect(apiClient.get).toHaveBeenCalledWith('/roles', {
      params: { page: 1, search: 'Concierge' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Concierge');
    expect(result.meta.pagination.total).toBe(1);
  });

  it('getActiveRoles fetches active roles list', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [{ _id: 'r-1', name: 'Concierge' }] },
    });

    const result = await getActiveRoles();

    expect(apiClient.get).toHaveBeenCalledWith('/roles/active');
    expect(result).toHaveLength(1);
  });

  it('getRole fetches role by id', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'r-1', name: 'Concierge' } },
    });

    const result = await getRole('r-1');

    expect(apiClient.get).toHaveBeenCalledWith('/roles/r-1');
    expect(result.name).toBe('Concierge');
  });

  it('createRole posts payload', async () => {
    const payload = {
      name: 'Concierge',
      permissions: ['bookings.read'],
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'r-2', ...payload } },
    });

    const result = await createRole(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/roles', payload);
    expect(result._id).toBe('r-2');
  });

  it('updateRole patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'r-1', description: 'Updated' } },
    });

    const result = await updateRole('r-1', { description: 'Updated' });

    expect(apiClient.patch).toHaveBeenCalledWith('/roles/r-1', { description: 'Updated' });
    expect(result._id).toBe('r-1');
  });

  it('deleteRole calls delete endpoint', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteRole('r-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/roles/r-1');
  });

  it('restoreRole calls restore endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'r-1', isDeleted: false } },
    });

    const result = await restoreRole('r-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/roles/r-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
