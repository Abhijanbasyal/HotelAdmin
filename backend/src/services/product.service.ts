import { Types, type FilterQuery } from 'mongoose';
import { Product, type IProduct } from '@/models/Product.model';
import { Category } from '@/models/Category.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type { CreateProductInput, UpdateProductInput, ProductQueryParams } from '@/validators/product.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class ProductService {
  /**
   * Validates that the referenced category exists and is not soft-deleted.
   */
  private static async validateActiveCategory(categoryId: string | Types.ObjectId): Promise<void> {
    const category = await Category.findOne({ _id: categoryId, isDeleted: false });
    if (!category) {
      throw AppError.badRequest('Referenced category does not exist or has been deleted.');
    }
    if (category.status !== 'active') {
      throw AppError.badRequest('Cannot assign products to an inactive category.');
    }
  }

  /**
   * Create a new product.
   */
  static async create(
    data: CreateProductInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IProduct> {
    // 1. Validate Category validity
    await this.validateActiveCategory(data.category);

    // 2. Validate SKU uniqueness among active records
    const normalizedSku = data.sku.trim().toUpperCase();
    const existingSku = await Product.findOne({ sku: normalizedSku, isDeleted: false });
    if (existingSku) {
      throw AppError.conflict(`An active product with SKU "${normalizedSku}" already exists.`);
    }

    // 3. Create document
    const product = await Product.create({
      ...data,
      sku: normalizedSku,
      category: new Types.ObjectId(data.category),
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name, sku: product.sku, price: product.price },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return product.populate('category', 'name image status');
  }

  /**
   * List products with pagination, search, category filter, and inventory filters.
   */
  static async list(query: ProductQueryParams): Promise<IPaginatedResult<IProduct>> {
    const allowedSort = ['createdAt', 'name', 'sku', 'price', 'stockQuantity', 'isAvailable'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<IProduct> = {};

    if (query.category) {
      filter.category = new Types.ObjectId(query.category);
    }

    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable;
    }

    // Price range filters
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: { $gte?: number; $lte?: number } = {};
      if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
      filter.price = priceFilter;
    }

    // Inventory stock status filters
    if (query.stockStatus) {
      if (query.stockStatus === 'out_of_stock') {
        filter.stockQuantity = 0;
      } else if (query.stockStatus === 'low_stock') {
        filter.stockQuantity = { $gt: 0, $lte: 5 };
      } else if (query.stockStatus === 'in_stock') {
        filter.stockQuantity = { $gt: 5 };
      }
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { sku: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    return paginateQuery(Product, filter, options, undefined, {
      path: 'category',
      select: 'name image status',
    });
  }

  /**
   * Get product by ID with populated category.
   */
  static async getById(id: string): Promise<IProduct> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid product identifier format');
    }

    const product = await Product.findById(id).populate('category', 'name image status');
    if (!product) {
      throw AppError.notFound('Product');
    }

    return product;
  }

  /**
   * Update product.
   */
  static async update(
    id: string,
    data: UpdateProductInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IProduct> {
    const product = await this.getById(id);

    // If category modified, ensure new category is active
    if (data.category && data.category !== product.category._id.toString()) {
      await this.validateActiveCategory(data.category);
    }

    // If SKU modified, ensure no collision
    if (data.sku) {
      const normalizedSku = data.sku.trim().toUpperCase();
      if (normalizedSku !== product.sku) {
        const conflict = await Product.findOne({
          sku: normalizedSku,
          isDeleted: false,
          _id: { $ne: product._id },
        });

        if (conflict) {
          throw AppError.conflict(`An active product with SKU "${normalizedSku}" already exists.`);
        }
        data.sku = normalizedSku;
      }
    }

    Object.assign(product, data);
    await product.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: product._id.toString(),
      details: { updatedFields: Object.keys(data) },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return product.populate('category', 'name image status');
  }

  /**
   * Soft delete product.
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IProduct> {
    return softDeleteDocument(Product, id, user?.id, reqContext);
  }

  /**
   * Restore soft-deleted product with unique SKU check.
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IProduct> {
    const product = await this.getById(id);

    // Verify referenced category is still active before restoration
    const categoryId = product.category instanceof Types.ObjectId ? product.category : product.category._id;
    const cat = await Category.findOne({ _id: categoryId, isDeleted: false });
    if (!cat) {
      throw AppError.badRequest(
        'Cannot restore product: its assigned category is currently deleted or inactive. Please restore the category first.'
      );
    }

    return restoreDocument(Product, id, user?.id, {
      uniqueChecks: [{ field: 'sku' }],
      reqContext,
    });
  }
}
