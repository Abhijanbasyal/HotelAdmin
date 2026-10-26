import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DepartmentsPage from './page';
import * as departmentApi from '@/services/api/department.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/departments',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/department.api', () => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
  restoreDepartment: vi.fn(),
}));

describe('DepartmentsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (departmentApi.listDepartments as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: 'd-1',
          id: 'd-1',
          name: 'Front Office',
          code: 'FO',
          description: 'Guest relations',
          status: 'active',
          isDeleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });

  it('renders departments header, statistics, and table data', async () => {
    render(<DepartmentsPage />);

    expect(screen.getByRole('heading', { name: /Departments/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search department name/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Front Office')).toBeInTheDocument();
      expect(screen.getByText('FO')).toBeInTheDocument();
    });
  });

  it('opens add department modal and submits new department', async () => {
    (departmentApi.createDepartment as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 'd-2',
      name: 'Housekeeping',
      code: 'HK',
      status: 'active',
    });

    render(<DepartmentsPage />);

    const addBtn = screen.getByRole('button', { name: /Add Department/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add Department/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Department Name/i), {
      target: { value: 'Housekeeping' },
    });
    fireEvent.change(screen.getByLabelText(/Department Code/i), {
      target: { value: 'HK' },
    });

    const submitBtn = screen.getByRole('button', { name: /Create Department/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(departmentApi.createDepartment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Housekeeping',
          code: 'HK',
        })
      );
    });
  });
});
