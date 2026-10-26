import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';
import type { DepartmentItem } from './department.api';

export interface RoleItem {
  id: string;
  _id: string;
  name: string;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
}

export interface StaffItem {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: RoleItem | string;
  department?: DepartmentItem | string | null;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  isActive: boolean;
  isDeleted: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password?: string;
  role: string;
  department?: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export type UpdateStaffPayload = Partial<CreateStaffPayload>;

export async function listStaff(
  params: StaffQueryParams = {}
): Promise<{ data: StaffItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<StaffItem[]>>('/staff', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getActiveRoles(): Promise<RoleItem[]> {
  const response = await apiClient.get<ApiResponse<RoleItem[]>>('/staff/roles');
  return response.data.data ?? [];
}

export async function getStaff(id: string): Promise<StaffItem> {
  const response = await apiClient.get<ApiResponse<StaffItem>>(`/staff/${id}`);
  return response.data.data!;
}

export async function createStaff(payload: CreateStaffPayload): Promise<StaffItem> {
  const response = await apiClient.post<ApiResponse<StaffItem>>('/staff', payload);
  return response.data.data!;
}

export async function updateStaff(id: string, payload: UpdateStaffPayload): Promise<StaffItem> {
  const response = await apiClient.patch<ApiResponse<StaffItem>>(`/staff/${id}`, payload);
  return response.data.data!;
}

export async function deleteStaff(id: string): Promise<void> {
  await apiClient.delete(`/staff/${id}`);
}

export async function restoreStaff(id: string): Promise<StaffItem> {
  const response = await apiClient.patch<ApiResponse<StaffItem>>(`/staff/${id}/restore`);
  return response.data.data!;
}
