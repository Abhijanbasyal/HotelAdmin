import type { Request, Response } from 'express';
import { RoleService } from '@/services/role.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  CreateRoleInput,
  UpdateRoleInput,
  RoleQueryParams,
} from '@/validators/role.validator';

export class RoleController {
  static getPermissionsList = (_req: Request, res: Response) => {
    const permissions = RoleService.getPermissionsList();
    return ApiResponse.success(res, permissions, 'Permissions list retrieved successfully');
  };

  static getActive = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await RoleService.getActive();
    return ApiResponse.success(res, roles, 'Active roles retrieved successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as RoleQueryParams;
    const result = await RoleService.list(query);
    return ApiResponse.paginated(res, result.data, result.pagination, 'Roles retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = await RoleService.getById(id);
    return ApiResponse.success(res, role, 'Role retrieved successfully');
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateRoleInput;
    const role = await RoleService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });
    return ApiResponse.created(res, role, 'Role created successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateRoleInput;
    const role = await RoleService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });
    return ApiResponse.success(res, role, 'Role updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = await RoleService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });
    return ApiResponse.success(res, role, 'Role deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = await RoleService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });
    return ApiResponse.success(res, role, 'Role restored successfully');
  });
}
