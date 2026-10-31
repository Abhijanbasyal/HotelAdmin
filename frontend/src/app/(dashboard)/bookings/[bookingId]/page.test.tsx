import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingDetailsPage from './page';
import * as bookingApi from '@/services/api/booking.api';
import * as tableApi from '@/services/api/table.api';
import * as customerApi from '@/services/api/customer.api';
import * as auditApi from '@/services/api/audit.api';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/bookings/bkg-123',
  useSearchParams: () => new URLSearchParams('returnUrl=/bookings?page=1'),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/booking.api', () => ({
  getBooking: vi.fn(),
  updateBooking: vi.fn(),
  updateBookingStatus: vi.fn(),
  deleteBooking: vi.fn(),
}));

vi.mock('@/services/api/table.api', () => ({
  getActiveTables: vi.fn(),
}));

vi.mock('@/services/api/customer.api', () => ({
  listCustomers: vi.fn(),
}));

vi.mock('@/services/api/audit.api', () => ({
  listAuditLogs: vi.fn(),
}));

const mockBookingData = {
  _id: 'bkg-123',
  id: 'bkg-123',
  bookingNumber: 'BKG-202611-XYZ1',
  customer: {
    _id: 'cust-456',
    name: 'Eleanor Vance',
    phone: '+1-555-0899',
    email: 'eleanor@example.com',
    status: 'active',
  },
  table: {
    _id: 'tbl-789',
    tableNumber: 'T-104',
    capacity: 4,
    location: 'Patio & Garden',
    status: 'available',
  },
  guestCount: 3,
  bookingDate: '2026-11-20T00:00:00.000Z',
  startTime: '19:30',
  endTime: '21:30',
  startDateTime: '2026-11-20T19:30:00.000Z',
  endDateTime: '2026-11-20T21:30:00.000Z',
  status: 'confirmed' as const,
  specialRequests: 'Quiet corner table near flowers',
  createdBy: {
    _id: 'usr-1',
    name: 'FrontDesk Manager',
    email: 'manager@hotel.com',
  },
  isDeleted: false,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

describe('BookingDetailsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bookingApi.getBooking as ReturnType<typeof vi.fn>).mockResolvedValue(mockBookingData);
    (tableApi.getActiveTables as ReturnType<typeof vi.fn>).mockResolvedValue([mockBookingData.table]);
    (customerApi.listCustomers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [mockBookingData.customer],
    });
    (auditApi.listAuditLogs as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [
        {
          _id: 'aud-1',
          action: 'CREATE',
          entityType: 'Booking',
          entityId: 'bkg-123',
          userName: 'FrontDesk Manager',
          createdAt: '2026-11-01T10:00:00.000Z',
          details: { status: 'confirmed' },
        },
      ],
      meta: { pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } },
    });
  });

  it('renders booking details, header, breadcrumbs and overview information', async () => {
    render(<BookingDetailsPage params={{ bookingId: 'bkg-123' }} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /BKG-202611-XYZ1/i })).toBeInTheDocument();
      expect(screen.getByText(/Eleanor Vance/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Table T-104/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('CONFIRMED').length).toBeGreaterThan(0);
    });

    // Check Back to Bookings button
    expect(screen.getByRole('button', { name: /Back to Bookings/i })).toBeInTheDocument();

    // Check Overview tab contents
    expect(screen.getByText(/Reservation Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Quiet corner table near flowers/i)).toBeInTheDocument();
  });

  it('navigates through contextual sub-tabs (Guest, Table, History)', async () => {
    render(<BookingDetailsPage params={{ bookingId: 'bkg-123' }} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /BKG-202611-XYZ1/i })).toBeInTheDocument();
    });

    // Click Guest Information tab
    const guestTab = screen.getByRole('tab', { name: /Guest Information/i });
    fireEvent.click(guestTab);

    await waitFor(() => {
      expect(screen.getByText('+1-555-0899')).toBeInTheDocument();
      expect(screen.getByText('eleanor@example.com')).toBeInTheDocument();
    });

    // Click Table & Schedule tab
    const tableTab = screen.getByRole('tab', { name: /Table & Schedule/i });
    fireEvent.click(tableTab);

    await waitFor(() => {
      expect(screen.getByText(/Patio & Garden/i)).toBeInTheDocument();
      expect(screen.getByText(/4 Seats/i)).toBeInTheDocument();
      expect(screen.getByText(/Seating Start Time/i)).toBeInTheDocument();
    });

    // Click Activity History tab
    const historyTab = screen.getByRole('tab', { name: /Activity History/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText('CREATE')).toBeInTheDocument();
      expect(screen.getAllByText(/FrontDesk Manager/i).length).toBeGreaterThan(0);
    });
  });

  it('navigates back to previous booking list state when Back to Bookings is clicked', async () => {
    render(<BookingDetailsPage params={{ bookingId: 'bkg-123' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Bookings/i })).toBeInTheDocument();
    });

    const backBtn = screen.getByRole('button', { name: /Back to Bookings/i });
    fireEvent.click(backBtn);

    expect(mockPush).toHaveBeenCalledWith('/bookings?page=1');
  });

  it('triggers Seat Guest quick action to update status to seated', async () => {
    (bookingApi.updateBookingStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockBookingData,
      status: 'seated',
    });

    render(<BookingDetailsPage params={{ bookingId: 'bkg-123' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Seat Guest/i })).toBeInTheDocument();
    });

    const seatBtn = screen.getByRole('button', { name: /Seat Guest/i });
    fireEvent.click(seatBtn);

    await waitFor(() => {
      expect(bookingApi.updateBookingStatus).toHaveBeenCalledWith('bkg-123', 'seated');
    });
  });

  it('opens confirmation dialog and confirms cancellation of the reservation', async () => {
    (bookingApi.updateBookingStatus as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...mockBookingData,
      status: 'cancelled',
    });

    render(<BookingDetailsPage params={{ bookingId: 'bkg-123' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel Reservation/i })).toBeInTheDocument();
    });

    const cancelActionBtn = screen.getByRole('button', { name: /Cancel Reservation/i });
    fireEvent.click(cancelActionBtn);

    // Confirm dialog should open
    await waitFor(() => {
      expect(screen.getByText(/Cancel Guest Reservation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Cancellation/i })).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(bookingApi.updateBookingStatus).toHaveBeenCalledWith('bkg-123', 'cancelled');
    });
  });
});
