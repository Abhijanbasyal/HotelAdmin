import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  restoreBooking,
} from './booking.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Booking API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listBookings sends query parameters and returns paginated result', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: [
          {
            _id: 'bkg-1',
            id: 'bkg-1',
            bookingNumber: 'BKG-202611-ABCD',
            customer: { _id: 'c-1', name: 'Alice', phone: '123' },
            table: { _id: 't-1', tableNumber: 'T-01', capacity: 4 },
            guestCount: 2,
            bookingDate: '2026-11-15',
            startTime: '18:00',
            endTime: '20:00',
            status: 'confirmed',
            isDeleted: false,
          },
        ],
        meta: {
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockResponse);

    const result = await listBookings({ page: 1, date: '2026-11-15' });

    expect(apiClient.get).toHaveBeenCalledWith('/bookings', {
      params: { page: 1, date: '2026-11-15' },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].bookingNumber).toBe('BKG-202611-ABCD');
    expect(result.meta.pagination.total).toBe(1);
  });

  it('getBooking fetches booking by id', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: { _id: 'bkg-1', bookingNumber: 'BKG-001', guestCount: 4 },
      },
    });

    const result = await getBooking('bkg-1');

    expect(apiClient.get).toHaveBeenCalledWith('/bookings/bkg-1');
    expect(result.bookingNumber).toBe('BKG-001');
  });

  it('createBooking posts payload', async () => {
    const payload = {
      customer: 'c-1',
      table: 't-1',
      guestCount: 2,
      bookingDate: '2026-11-15',
      startTime: '18:00',
      endTime: '20:00',
    };
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'bkg-2', ...payload, bookingNumber: 'BKG-002' } },
    });

    const result = await createBooking(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/bookings', payload);
    expect(result._id).toBe('bkg-2');
  });

  it('updateBooking patches payload', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'bkg-1', guestCount: 3 } },
    });

    const result = await updateBooking('bkg-1', { guestCount: 3 });

    expect(apiClient.patch).toHaveBeenCalledWith('/bookings/bkg-1', { guestCount: 3 });
    expect(result._id).toBe('bkg-1');
  });

  it('updateBookingStatus patches status endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'bkg-1', status: 'seated' } },
    });

    const result = await updateBookingStatus('bkg-1', 'seated');

    expect(apiClient.patch).toHaveBeenCalledWith('/bookings/bkg-1/status', { status: 'seated' });
    expect(result.status).toBe('seated');
  });

  it('deleteBooking calls delete endpoint', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true },
    });

    await deleteBooking('bkg-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/bookings/bkg-1');
  });

  it('restoreBooking calls restore endpoint', async () => {
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 'bkg-1', isDeleted: false } },
    });

    const result = await restoreBooking('bkg-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/bookings/bkg-1/restore');
    expect(result.isDeleted).toBe(false);
  });
});
