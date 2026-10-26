import type { Request, Response } from 'express';
import { AuditService } from '@/services/audit.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { AuditLogQueryParams } from '@/validators/audit.validator';

export class AuditController {
  /**
   * GET /api/v1/audit-logs
   * List audit logs with pagination and filters.
   */
  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as AuditLogQueryParams;
    const result = await AuditService.getAuditLogs(query);

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      'Audit logs retrieved successfully'
    );
  });

  /**
   * GET /api/v1/audit-logs/:id
   * Get single audit log details.
   */
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const log = await AuditService.getAuditLogById(id);

    return ApiResponse.success(res, log, 'Audit log details retrieved successfully');
  });
}
