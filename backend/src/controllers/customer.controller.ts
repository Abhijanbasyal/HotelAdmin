import type { Request, Response } from 'express';
import { CustomerService } from '@/services/customer.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryParams,
} from '@/validators/customer.validator';

export class CustomerController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateCustomerInput;
    const customer = await CustomerService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.created(res, customer, 'Customer created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as CustomerQueryParams;
    const result = await CustomerService.list(query);

    return ApiResponse.paginated(res, result.data, result.pagination, 'Customers retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await CustomerService.getById(id);

    return ApiResponse.success(res, customer, 'Customer retrieved successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateCustomerInput;
    const customer = await CustomerService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, customer, 'Customer updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await CustomerService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, customer, 'Customer soft-deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await CustomerService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, customer, 'Customer restored successfully');
  });
}
