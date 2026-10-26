import type { Request, Response } from 'express';
import { CategoryService } from '@/services/category.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { CreateCategoryInput, UpdateCategoryInput, CategoryQueryParams } from '@/validators/category.validator';

export class CategoryController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateCategoryInput;
    const category = await CategoryService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.created(res, category, 'Category created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as CategoryQueryParams;
    const result = await CategoryService.list(query);

    return ApiResponse.paginated(res, result.data, result.pagination, 'Categories retrieved successfully');
  });

  static getActive = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await CategoryService.getActiveCategories();
    return ApiResponse.success(res, categories, 'Active categories retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await CategoryService.getById(id);

    return ApiResponse.success(res, category, 'Category retrieved successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateCategoryInput;
    const category = await CategoryService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, category, 'Category updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await CategoryService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, category, 'Category soft-deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await CategoryService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, category, 'Category restored successfully');
  });
}
