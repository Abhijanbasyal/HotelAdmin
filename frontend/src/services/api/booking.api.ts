import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export type BookingStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

export interface CustomerSummary {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  status: string;
}

export interface TableSummary {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: string;
}

export interface BookingItem {
  id: string;
  _id: string;
  bookingNumber: string;
  customer: CustomerSummary;
  table: TableSummary;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
  status: BookingStatus;
  specialRequests?: string;
  createdBy?: { _id: string; name: string; email: string };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  table?: string;
  customer?: string;
  status?: BookingStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  includeDeleted?: boolean;
}

export interface CreateBookingPayload {
  customer: string;
  table: string;
  guestCount: number;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  specialRequests?: string;
  status?: BookingStatus;
}

export type UpdateBookingPayload = Partial<CreateBookingPayload>;

export async function listBookings(
  params: BookingQueryParams = {}
): Promise<{ data: BookingItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<BookingItem[]>>('/bookings', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getBooking(id: string): Promise<BookingItem> {
  const response = await apiClient.get<ApiResponse<BookingItem>>(`/bookings/${id}`);
  return response.data.data!;
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingItem> {
  const response = await apiClient.post<ApiResponse<BookingItem>>('/bookings', payload);
  return response.data.data!;
}

export async function updateBooking(id: string, payload: UpdateBookingPayload): Promise<BookingItem> {
  const response = await apiClient.patch<ApiResponse<BookingItem>>(`/bookings/${id}`, payload);
  return response.data.data!;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<BookingItem> {
  const response = await apiClient.patch<ApiResponse<BookingItem>>(`/bookings/${id}/status`, { status });
  return response.data.data!;
}

export async function deleteBooking(id: string): Promise<void> {
  await apiClient.delete(`/bookings/${id}`);
}

export async function restoreBooking(id: string): Promise<BookingItem> {
  const response = await apiClient.patch<ApiResponse<BookingItem>>(`/bookings/${id}/restore`);
  return response.data.data!;
}
