import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export type TableLocation = 'indoor' | 'outdoor' | 'terrace' | 'rooftop' | 'bar' | 'vip';
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface TableItem {
  id: string;
  _id: string;
  tableNumber: string;
  capacity: number;
  location: TableLocation;
  status: TableStatus;
  description?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  location?: TableLocation;
  status?: TableStatus;
  minCapacity?: number;
  includeDeleted?: boolean;
}

export interface CreateTablePayload {
  tableNumber: string;
  capacity: number;
  location: TableLocation;
  status?: TableStatus;
  description?: string;
}

export type UpdateTablePayload = Partial<CreateTablePayload>;

export async function listTables(
  params: TableQueryParams = {}
): Promise<{ data: TableItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<TableItem[]>>('/tables', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getActiveTables(minCapacity?: number): Promise<TableItem[]> {
  const params = minCapacity ? { minCapacity } : {};
  const response = await apiClient.get<ApiResponse<TableItem[]>>('/tables/active', { params });
  return response.data.data ?? [];
}

export async function getTable(id: string): Promise<TableItem> {
  const response = await apiClient.get<ApiResponse<TableItem>>(`/tables/${id}`);
  return response.data.data!;
}

export async function createTable(payload: CreateTablePayload): Promise<TableItem> {
  const response = await apiClient.post<ApiResponse<TableItem>>('/tables', payload);
  return response.data.data!;
}

export async function updateTable(id: string, payload: UpdateTablePayload): Promise<TableItem> {
  const response = await apiClient.patch<ApiResponse<TableItem>>(`/tables/${id}`, payload);
  return response.data.data!;
}

export async function deleteTable(id: string): Promise<void> {
  await apiClient.delete(`/tables/${id}`);
}

export async function restoreTable(id: string): Promise<TableItem> {
  const response = await apiClient.patch<ApiResponse<TableItem>>(`/tables/${id}/restore`);
  return response.data.data!;
}
