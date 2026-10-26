import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';
import type { CategoryItem } from './category.api';

export interface ProductItem {
  id: string;
  _id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  category: CategoryItem | string;
  images: string[];
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: string;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock';
  includeDeleted?: boolean;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  description?: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  category: string;
  images?: string[];
  isAvailable?: boolean;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export async function listProducts(
  params: ProductQueryParams = {}
): Promise<{ data: ProductItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<ProductItem[]>>('/products', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}

export async function getProduct(id: string): Promise<ProductItem> {
  const response = await apiClient.get<ApiResponse<ProductItem>>(`/products/${id}`);
  return response.data.data!;
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductItem> {
  const response = await apiClient.post<ApiResponse<ProductItem>>('/products', payload);
  return response.data.data!;
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<ProductItem> {
  const response = await apiClient.patch<ApiResponse<ProductItem>>(`/products/${id}`, payload);
  return response.data.data!;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function restoreProduct(id: string): Promise<ProductItem> {
  const response = await apiClient.patch<ApiResponse<ProductItem>>(`/products/${id}/restore`);
  return response.data.data!;
}
