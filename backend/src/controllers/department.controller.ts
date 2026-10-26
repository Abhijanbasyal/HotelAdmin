import type { Request, Response } from 'express';
import { DepartmentService } from '@/services/department.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentQueryParams,
} from '@/validators/department.validator';

export class DepartmentController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateDepartmentInput;
    const dept = await DepartmentService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.created(res, dept, 'Department created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as DepartmentQueryParams;
    const result = await DepartmentService.list(query);

    return ApiResponse.paginated(res, result.data, result.pagination, 'Departments retrieved successfully');
  });

  static getActive = asyncHandler(async (_req: Request, res: Response) => {
    const departments = await DepartmentService.getActive();
    return ApiResponse.success(res, departments, 'Active departments retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dept = await DepartmentService.getById(id);

    return ApiResponse.success(res, dept, 'Department retrieved successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateDepartmentInput;
    const dept = await DepartmentService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, dept, 'Department updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dept = await DepartmentService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, dept, 'Department soft-deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dept = await DepartmentService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, dept, 'Department restored successfully');
  });
}
