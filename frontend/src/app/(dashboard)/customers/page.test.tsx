import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomersPage from './page';
import * as customerApi from '@/services/api/customer.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/customers',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/customer.api', () => ({
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  restoreCustomer: vi.fn(),
}));

describe('CustomersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (customerApi.listCustomers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: 'c-1',
          id: 'c-1',
          name: 'John Doe',
          phone: '+1-555-0199',
          email: 'john@example.com',
          status: 'active',
          idType: 'passport',
          idNumber: 'PA12345',
          isDeleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });

  it('renders customers header and table data', async () => {
    render(<CustomersPage />);

    expect(screen.getByRole('heading', { name: /Customers/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name, phone, email/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0199')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('opens registration modal and registers a new customer', async () => {
    (customerApi.createCustomer as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 'c-2',
      name: 'Sarah Connor',
      phone: '+1-555-0888',
      status: 'active',
    });

    render(<CustomersPage />);

    const addBtn = screen.getByRole('button', { name: /Add Customer/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Register New Customer/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Sarah Connor' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+1-555-0888' },
    });

    const submitBtn = screen.getByRole('button', { name: /Register Customer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(customerApi.createCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Sarah Connor',
          phone: '+1-555-0888',
        })
      );
    });
  });
});
