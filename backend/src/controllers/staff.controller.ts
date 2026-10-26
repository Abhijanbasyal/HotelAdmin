import type { Request, Response } from 'express';
import { StaffService } from '@/services/staff.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  StaffQueryParams,
} from '@/validators/staff.validator';

export class StaffController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateStaffInput;
    const staff = await StaffService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.created(res, staff, 'Staff member created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as StaffQueryParams;
    const result = await StaffService.list(query);

    return ApiResponse.paginated(res, result.data, result.pagination, 'Staff members retrieved successfully');
  });

  static getRoles = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await StaffService.getActiveRoles();
    return ApiResponse.success(res, roles, 'Active roles retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const staff = await StaffService.getById(id);

    return ApiResponse.success(res, staff, 'Staff member retrieved successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateStaffInput;
    const staff = await StaffService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, staff, 'Staff member updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const staff = await StaffService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, staff, 'Staff member soft-deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const staff = await StaffService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, staff, 'Staff member restored successfully');
  });
}
