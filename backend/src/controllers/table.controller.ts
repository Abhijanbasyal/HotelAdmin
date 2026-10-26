import type { Request, Response } from 'express';
import { TableService } from '@/services/table.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  CreateTableInput,
  UpdateTableInput,
  TableQueryParams,
} from '@/validators/table.validator';

export class TableController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateTableInput;
    const table = await TableService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.created(res, table, 'Table created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as TableQueryParams;
    const result = await TableService.list(query);

    return ApiResponse.paginated(res, result.data, result.pagination, 'Tables retrieved successfully');
  });

  static getActive = asyncHandler(async (req: Request, res: Response) => {
    const minCapacity = req.query.minCapacity ? parseInt(req.query.minCapacity as string, 10) : undefined;
    const tables = await TableService.getActive(minCapacity);
    return ApiResponse.success(res, tables, 'Active tables retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const table = await TableService.getById(id);

    return ApiResponse.success(res, table, 'Table retrieved successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateTableInput;
    const table = await TableService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, table, 'Table updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const table = await TableService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, table, 'Table soft-deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const table = await TableService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, table, 'Table restored successfully');
  });
}
