import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export type DepartmentStatus = 'active' | 'inactive';

export interface DepartmentItem {
  id: string;
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: DepartmentStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: 'active' | 'inactive';
  includeDeleted?: boolean;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export async function listDepartments(
  params: DepartmentQueryParams = {}
): Promise<{ data: DepartmentItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<DepartmentItem[]>>('/departments', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getActiveDepartments(): Promise<Array<{ _id: string; name: string; code: string }>> {
  const response = await apiClient.get<ApiResponse<Array<{ _id: string; name: string; code: string }>>>('/departments/active');
  return response.data.data ?? [];
}

export async function getDepartment(id: string): Promise<DepartmentItem> {
  const response = await apiClient.get<ApiResponse<DepartmentItem>>(`/departments/${id}`);
  return response.data.data!;
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<DepartmentItem> {
  const response = await apiClient.post<ApiResponse<DepartmentItem>>('/departments', payload);
  return response.data.data!;
}

export async function updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<DepartmentItem> {
  const response = await apiClient.patch<ApiResponse<DepartmentItem>>(`/departments/${id}`, payload);
  return response.data.data!;
}

export async function deleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/departments/${id}`);
}

export async function restoreDepartment(id: string): Promise<DepartmentItem> {
  const response = await apiClient.patch<ApiResponse<DepartmentItem>>(`/departments/${id}/restore`);
  return response.data.data!;
}
