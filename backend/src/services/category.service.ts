import { Types, type FilterQuery } from 'mongoose';
import { Category, type ICategory } from '@/models/Category.model';
import { Product } from '@/models/Product.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type { CreateCategoryInput, UpdateCategoryInput, CategoryQueryParams } from '@/validators/category.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class CategoryService {
  /**
   * Create a new category.
   */
  static async create(
    data: CreateCategoryInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICategory> {
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      isDeleted: false,
    });

    if (existing) {
      throw AppError.conflict(`An active category with name "${data.name}" already exists.`);
    }

    const category = await Category.create({
      ...data,
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Category',
      entityId: category._id.toString(),
      details: { name: category.name, status: category.status },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return category;
  }

  /**
   * List categories with pagination, search, and product count.
   */
  static async list(query: CategoryQueryParams): Promise<IPaginatedResult<ICategory & { productCount?: number }>> {
    const allowedSort = ['createdAt', 'name', 'status'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<ICategory> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    const result = await paginateQuery(Category, filter, options);

    // Compute active product counts per category in batch
    const categoryIds = result.data.map((c) => c._id);
    const productCounts = await Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { category: { $in: categoryIds }, isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of productCounts) {
      countMap.set(item._id.toString(), item.count);
    }

    const dataWithCounts = result.data.map((cat) => {
      const plain = cat.toObject() as unknown as ICategory & { productCount?: number };
      plain.productCount = countMap.get(cat._id.toString()) || 0;
      return plain;
    });

    return {
      data: dataWithCounts,
      pagination: result.pagination,
    };
  }

  /**
   * Lightweight list of active categories for select dropdowns.
   */
  static async getActiveCategories(): Promise<Array<{ _id: Types.ObjectId; name: string }>> {
    return Category.find({ status: 'active', isDeleted: false })
      .select('_id name')
      .sort({ name: 1 })
      .lean();
  }

  /**
   * Get single category by ID.
   */
  static async getById(id: string): Promise<ICategory> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid category identifier format');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category');
    }

    return category;
  }

  /**
   * Update category.
   */
  static async update(
    id: string,
    data: UpdateCategoryInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICategory> {
    const category = await this.getById(id);

    if (data.name && data.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const conflict = await Category.findOne({
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
        isDeleted: false,
        _id: { $ne: category._id },
      });

      if (conflict) {
        throw AppError.conflict(`An active category with name "${data.name}" already exists.`);
      }
    }

    Object.assign(category, data);
    await category.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Category',
      entityId: category._id.toString(),
      details: { updatedFields: Object.keys(data) },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return category;
  }

  /**
   * Soft delete category. Prevents deletion if active products are assigned.
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICategory> {
    // Prevent or warn if products are assigned
    const activeProducts = await Product.countDocuments({
      category: new Types.ObjectId(id),
      isDeleted: false,
    });

    if (activeProducts > 0) {
      throw AppError.badRequest(
        `Cannot delete category: ${activeProducts} active product(s) are assigned to it. Please reassign or delete these products first.`
      );
    }

    return softDeleteDocument(Category, id, user?.id, reqContext);
  }

  /**
   * Restore soft-deleted category with unique name validation.
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ICategory> {
    return restoreDocument(Category, id, user?.id, {
      uniqueChecks: [{ field: 'name' }],
      reqContext,
    });
  }
}
