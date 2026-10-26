import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingsPage from './page';
import * as bookingApi from '@/services/api/booking.api';
import * as tableApi from '@/services/api/table.api';
import * as customerApi from '@/services/api/customer.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/bookings',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/booking.api', () => ({
  listBookings: vi.fn(),
  createBooking: vi.fn(),
  updateBooking: vi.fn(),
  updateBookingStatus: vi.fn(),
  deleteBooking: vi.fn(),
  restoreBooking: vi.fn(),
}));

vi.mock('@/services/api/table.api', () => ({
  getActiveTables: vi.fn(),
}));

vi.mock('@/services/api/customer.api', () => ({
  listCustomers: vi.fn(),
}));

describe('BookingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tableApi.getActiveTables as ReturnType<typeof vi.fn>).mockResolvedValue([
      { _id: 't-1', tableNumber: 'T-101', capacity: 4, location: 'indoor', status: 'available' },
    ]);
    (customerApi.listCustomers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ _id: 'c-1', name: 'Alice Smith', phone: '+1-555-0100' }],
    });
    (bookingApi.listBookings as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: 'bkg-1',
          id: 'bkg-1',
          bookingNumber: 'BKG-202611-ABCD',
          customer: { _id: 'c-1', name: 'Alice Smith', phone: '+1-555-0100' },
          table: { _id: 't-1', tableNumber: 'T-101', capacity: 4, location: 'indoor' },
          guestCount: 2,
          bookingDate: '2026-11-15T00:00:00.000Z',
          startTime: '19:00',
          endTime: '21:00',
          status: 'confirmed',
          isDeleted: false,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });
  });

  it('renders bookings header, statistics, and booking row', async () => {
    render(<BookingsPage />);

    expect(screen.getByRole('heading', { name: /Bookings & Reservations/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search booking ref/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('BKG-202611-ABCD')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Seat Guest/i })).toBeInTheDocument();
    });
  });

  it('triggers quick status change when Seat Guest is clicked', async () => {
    (bookingApi.updateBookingStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 'bkg-1',
      status: 'seated',
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Seat Guest/i })).toBeInTheDocument();
    });

    const seatBtn = screen.getByRole('button', { name: /Seat Guest/i });
    fireEvent.click(seatBtn);

    await waitFor(() => {
      expect(bookingApi.updateBookingStatus).toHaveBeenCalledWith('bkg-1', 'seated');
    });
  });
});
