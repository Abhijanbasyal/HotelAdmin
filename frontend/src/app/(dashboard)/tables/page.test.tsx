import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TablesPage from './page';
import * as tableApi from '@/services/api/table.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/tables',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/table.api', () => ({
  listTables: vi.fn(),
  createTable: vi.fn(),
  updateTable: vi.fn(),
  deleteTable: vi.fn(),
  restoreTable: vi.fn(),
  getActiveTables: vi.fn(),
}));

describe('TablesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tableApi.listTables as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: 't-1',
          id: 't-1',
          tableNumber: 'T-101',
          capacity: 4,
          location: 'indoor',
          status: 'available',
          description: 'Window table',
          isDeleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });

  it('renders tables page header and table list', async () => {
    render(<TablesPage />);

    expect(screen.getByRole('heading', { name: /Tables & Seating/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search table number or description/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('T-101')).toBeInTheDocument();
      expect(screen.getByText('4 guests')).toBeInTheDocument();
      expect(screen.getAllByText(/Available/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens create table modal and submits new table', async () => {
    (tableApi.createTable as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 't-2',
      tableNumber: 'T-102',
      capacity: 6,
      location: 'outdoor',
      status: 'available',
    });

    render(<TablesPage />);

    const addBtn = screen.getByRole('button', { name: /Add Table/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add New Table/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Table Number/i), {
      target: { value: 'T-102' },
    });
    fireEvent.change(screen.getByLabelText(/Capacity \(Seats\)/i), {
      target: { value: '6' },
    });

    const submitBtn = screen.getByRole('button', { name: /Create Table/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(tableApi.createTable).toHaveBeenCalledWith(
        expect.objectContaining({
          tableNumber: 'T-102',
          capacity: 6,
        })
      );
    });
  });
});
