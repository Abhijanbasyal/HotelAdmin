import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RolesPage from './page';
import * as roleApi from '@/services/api/role.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/roles',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/role.api', () => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  restoreRole: vi.fn(),
  getAvailablePermissions: vi.fn(),
}));

describe('RolesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (roleApi.getAvailablePermissions as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'bookings.read', label: 'View Bookings', module: 'Bookings' },
      { id: 'bookings.create', label: 'Create Bookings', module: 'Bookings' },
    ]);
    (roleApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: 'r-1',
          id: 'r-1',
          name: 'Concierge Lead',
          description: 'Handles VIP bookings',
          permissions: ['bookings.read'],
          isSystem: false,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });

  it('renders roles page header and role record', async () => {
    render(<RolesPage />);

    expect(screen.getByRole('heading', { name: /Roles & Permissions/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search role name/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Concierge Lead')).toBeInTheDocument();
      expect(screen.getByText('Custom Role')).toBeInTheDocument();
    });
  });

  it('opens create role modal with permission checkboxes and submits', async () => {
    (roleApi.createRole as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 'r-2',
      name: 'Shift Supervisor',
      permissions: ['bookings.read'],
    });

    render(<RolesPage />);

    const createBtn = screen.getByRole('button', { name: /Create Role/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('heading', { name: /Create Custom Role/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Role Name/i), {
      target: { value: 'Shift Supervisor' },
    });

    const submitBtn = screen.getByRole('button', { name: /Create Custom Role/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(roleApi.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Shift Supervisor',
        })
      );
    });
  });
});
