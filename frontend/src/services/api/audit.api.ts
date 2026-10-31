import { apiClient, type ApiResponse } from './client';
import type { IPaginationMeta } from '@/types';

export interface AuditLogItem {
  _id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export async function listAuditLogs(
  params: AuditLogQueryParams = {}
): Promise<{ data: AuditLogItem[]; meta: { pagination: IPaginationMeta } }> {
  const response = await apiClient.get<ApiResponse<AuditLogItem[]>>('/audit-logs', { params });
  return {
    data: response.data.data ?? [],
    meta: (response.data as unknown as { meta: { pagination: IPaginationMeta } }).meta,
  };
}
