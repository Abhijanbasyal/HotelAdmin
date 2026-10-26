import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export type CustomerIdType = 'passport' | 'id_card' | 'driving_license' | 'other';
export type CustomerStatus = 'active' | 'inactive';

export interface CustomerItem {
  id: string;
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  idType?: CustomerIdType;
  idNumber?: string;
  notes?: string;
  avatarUrl?: string;
  status: CustomerStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: CustomerStatus;
  idType?: CustomerIdType;
  includeDeleted?: boolean;
}

export interface CreateCustomerPayload {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  idType?: CustomerIdType;
  idNumber?: string;
  notes?: string;
  avatarUrl?: string;
  status?: CustomerStatus;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export async function listCustomers(
  params: CustomerQueryParams = {}
): Promise<{ data: CustomerItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<CustomerItem[]>>('/customers', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getCustomer(id: string): Promise<CustomerItem> {
  const response = await apiClient.get<ApiResponse<CustomerItem>>(`/customers/${id}`);
  return response.data.data!;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<CustomerItem> {
  const response = await apiClient.post<ApiResponse<CustomerItem>>('/customers', payload);
  return response.data.data!;
}

export async function updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<CustomerItem> {
  const response = await apiClient.patch<ApiResponse<CustomerItem>>(`/customers/${id}`, payload);
  return response.data.data!;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

export async function restoreCustomer(id: string): Promise<CustomerItem> {
  const response = await apiClient.patch<ApiResponse<CustomerItem>>(`/customers/${id}/restore`);
  return response.data.data!;
}
