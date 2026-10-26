import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export interface PermissionDef {
  id: string;
  label: string;
  module: string;
}

export interface RoleItem {
  id: string;
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isSystem?: boolean;
  includeDeleted?: boolean;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

export async function getAvailablePermissions(): Promise<PermissionDef[]> {
  const response = await apiClient.get<ApiResponse<PermissionDef[]>>('/roles/permissions');
  return response.data.data ?? [];
}

export async function listRoles(
  params: RoleQueryParams = {}
): Promise<{ data: RoleItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<RoleItem[]>>('/roles', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getActiveRoles(): Promise<RoleItem[]> {
  const response = await apiClient.get<ApiResponse<RoleItem[]>>('/roles/active');
  return response.data.data ?? [];
}

export async function getRole(id: string): Promise<RoleItem> {
  const response = await apiClient.get<ApiResponse<RoleItem>>(`/roles/${id}`);
  return response.data.data!;
}

export async function createRole(payload: CreateRolePayload): Promise<RoleItem> {
  const response = await apiClient.post<ApiResponse<RoleItem>>('/roles', payload);
  return response.data.data!;
}

export async function updateRole(id: string, payload: UpdateRolePayload): Promise<RoleItem> {
  const response = await apiClient.patch<ApiResponse<RoleItem>>(`/roles/${id}`, payload);
  return response.data.data!;
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/roles/${id}`);
}

export async function restoreRole(id: string): Promise<RoleItem> {
  const response = await apiClient.patch<ApiResponse<RoleItem>>(`/roles/${id}/restore`);
  return response.data.data!;
}
