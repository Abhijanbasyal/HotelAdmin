import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export interface CategoryItem {
  id: string;
  _id: string;
  name: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
  productCount?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: 'active' | 'inactive';
  includeDeleted?: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: string;
  status?: 'active' | 'inactive';
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export async function listCategories(
  params: CategoryQueryParams = {}
): Promise<{ data: CategoryItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<CategoryItem[]>>('/categories', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getActiveCategories(): Promise<Array<{ _id: string; name: string }>> {
  const response = await apiClient.get<ApiResponse<Array<{ _id: string; name: string }>>>('/categories/active');
  return response.data.data ?? [];
}

export async function getCategory(id: string): Promise<CategoryItem> {
  const response = await apiClient.get<ApiResponse<CategoryItem>>(`/categories/${id}`);
  return response.data.data!;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<CategoryItem> {
  const response = await apiClient.post<ApiResponse<CategoryItem>>('/categories', payload);
  return response.data.data!;
}

export async function updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryItem> {
  const response = await apiClient.patch<ApiResponse<CategoryItem>>(`/categories/${id}`, payload);
  return response.data.data!;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

export async function restoreCategory(id: string): Promise<CategoryItem> {
  const response = await apiClient.patch<ApiResponse<CategoryItem>>(`/categories/${id}/restore`);
  return response.data.data!;
}
