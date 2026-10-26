import { Types, type FilterQuery } from 'mongoose';
import { Department, type IDepartment } from '@/models/Department.model';
import { User } from '@/models/User.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentQueryParams,
} from '@/validators/department.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class DepartmentService {
  /**
   * Create a new department
   */
  static async create(
    data: CreateDepartmentInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IDepartment> {
    const existingName = await Department.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      isDeleted: false,
    });
    if (existingName) {
      throw AppError.conflict(`An active department with name "${data.name}" already exists.`);
    }

    const existingCode = await Department.findOne({
      code: data.code.trim().toUpperCase(),
      isDeleted: false,
    });
    if (existingCode) {
      throw AppError.conflict(`An active department with code "${data.code}" already exists.`);
    }

    const dept = await Department.create({
      ...data,
      code: data.code.trim().toUpperCase(),
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Department',
      entityId: dept._id.toString(),
      details: { name: dept.name, code: dept.code },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return dept;
  }

  /**
   * List departments with pagination, search, status filter
   */
  static async list(query: DepartmentQueryParams): Promise<IPaginatedResult<IDepartment>> {
    const allowedSort = ['createdAt', 'name', 'code', 'status'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<IDepartment> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { code: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    return paginateQuery<IDepartment>(Department, filter, options);
  }

  /**
   * Get active departments list for dropdown select
   */
  static async getActive(): Promise<Array<{ _id: Types.ObjectId; name: string; code: string }>> {
    return Department.find({ status: 'active', isDeleted: false })
      .select('_id name code')
      .sort({ name: 1 })
      .lean();
  }

  /**
   * Find department by ID
   */
  static async getById(id: string): Promise<IDepartment> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid department identifier format');
    }

    const dept = await Department.findById(id);
    if (!dept) {
      throw AppError.notFound('Department');
    }

    return dept;
  }

  /**
   * Update department
   */
  static async update(
    id: string,
    data: UpdateDepartmentInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IDepartment> {
    const dept = await this.getById(id);

    if (data.name && data.name.trim().toLowerCase() !== dept.name.toLowerCase()) {
      const conflict = await Department.findOne({
        _id: { $ne: dept._id },
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
        isDeleted: false,
      });
      if (conflict) {
        throw AppError.conflict(`An active department with name "${data.name}" already exists.`);
      }
    }

    if (data.code && data.code.trim().toUpperCase() !== dept.code) {
      const conflict = await Department.findOne({
        _id: { $ne: dept._id },
        code: data.code.trim().toUpperCase(),
        isDeleted: false,
      });
      if (conflict) {
        throw AppError.conflict(`An active department with code "${data.code}" already exists.`);
      }
    }

    Object.assign(dept, {
      ...data,
      code: data.code ? data.code.trim().toUpperCase() : dept.code,
    });
    await dept.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Department',
      entityId: dept._id.toString(),
      details: { updatedFields: Object.keys(data) },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return dept;
  }

  /**
   * Soft-delete department with active staff check
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IDepartment> {
    const dept = await this.getById(id);

    // Prevent deletion if active staff assigned to this department
    const assignedStaffCount = await User.countDocuments({
      department: dept._id,
      isDeleted: false,
    });
    if (assignedStaffCount > 0) {
      throw AppError.conflict(
        `Cannot delete department "${dept.name}". There are ${assignedStaffCount} active staff members assigned to this department.`
      );
    }

    return softDeleteDocument(Department, id, user?.id, reqContext);
  }

  /**
   * Restore department
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IDepartment> {
    return restoreDocument(Department, id, user?.id, {
      uniqueChecks: [{ field: 'name' }, { field: 'code' }],
      reqContext,
    });
  }
}
