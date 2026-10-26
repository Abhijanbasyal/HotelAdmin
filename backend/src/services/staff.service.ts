import { Types, type FilterQuery } from 'mongoose';
import { User, type IUser } from '@/models/User.model';
import { Role } from '@/models/Role.model';
import { Department } from '@/models/Department.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  StaffQueryParams,
} from '@/validators/staff.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class StaffService {
  /**
   * Create a new staff account
   */
  static async create(
    data: CreateStaffInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IUser> {
    const existing = await User.findOne({
      email: data.email.toLowerCase(),
      isDeleted: false,
    });
    if (existing) {
      throw AppError.conflict(`An active user with email "${data.email}" already exists.`);
    }

    const roleDoc = await Role.findOne({ _id: data.role, isDeleted: false });
    if (!roleDoc) {
      throw AppError.badRequest('Specified role does not exist or has been deleted.');
    }

    if (data.department) {
      const deptDoc = await Department.findOne({ _id: data.department, isDeleted: false });
      if (!deptDoc) {
        throw AppError.badRequest('Specified department does not exist or has been deleted.');
      }
    }

    const staff = await User.create({
      ...data,
      email: data.email.toLowerCase(),
      role: new Types.ObjectId(data.role),
      department: data.department ? new Types.ObjectId(data.department) : undefined,
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'User',
      entityId: staff._id.toString(),
      details: { name: staff.name, email: staff.email, role: roleDoc.name },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return this.getById(staff._id.toString());
  }

  /**
   * List staff members with pagination, role & department filtering, search, and sorting
   */
  static async list(query: StaffQueryParams): Promise<IPaginatedResult<IUser>> {
    const allowedSort = ['createdAt', 'name', 'email', 'phone', 'jobTitle', 'isActive'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<IUser> = {};

    if (query.role) {
      filter.role = new Types.ObjectId(query.role);
    }

    if (query.department) {
      filter.department = new Types.ObjectId(query.department);
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { phone: { $regex: options.search, $options: 'i' } },
        { jobTitle: { $regex: options.search, $options: 'i' } },
      ];
    }

    const populate = [
      { path: 'role', select: '_id name description permissions isSystem' },
      { path: 'department', select: '_id name code status' },
    ];

    return paginateQuery<IUser>(User, filter, options, undefined, populate);
  }

  /**
   * Find staff member by ID with populated role and department
   */
  static async getById(id: string): Promise<IUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid staff identifier format');
    }

    const staff = await User.findOne({ _id: id, isDeleted: false })
      .populate('role', '_id name description permissions isSystem')
      .populate('department', '_id name code status');

    if (!staff) {
      throw AppError.notFound('Staff member');
    }

    return staff;
  }

  /**
   * Update an existing staff account
   */
  static async update(
    id: string,
    data: UpdateStaffInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IUser> {
    const staff = await this.getById(id);

    if (data.email && data.email.toLowerCase() !== staff.email) {
      const conflict = await User.findOne({
        _id: { $ne: staff._id },
        email: data.email.toLowerCase(),
        isDeleted: false,
      });
      if (conflict) {
        throw AppError.conflict(`An active user with email "${data.email}" already exists.`);
      }
      staff.email = data.email.toLowerCase();
    }

    if (data.role) {
      const roleDoc = await Role.findOne({ _id: data.role, isDeleted: false });
      if (!roleDoc) {
        throw AppError.badRequest('Specified role does not exist or has been deleted.');
      }
      staff.role = new Types.ObjectId(data.role);
    }

    if (data.department !== undefined) {
      if (data.department) {
        const deptDoc = await Department.findOne({ _id: data.department, isDeleted: false });
        if (!deptDoc) {
          throw AppError.badRequest('Specified department does not exist or has been deleted.');
        }
        staff.department = new Types.ObjectId(data.department);
      } else {
        staff.department = null;
      }
    }

    if (data.name) staff.name = data.name;
    if (data.phone !== undefined) staff.phone = data.phone;
    if (data.jobTitle !== undefined) staff.jobTitle = data.jobTitle;
    if (data.avatarUrl !== undefined) staff.avatarUrl = data.avatarUrl;
    if (data.isActive !== undefined) staff.isActive = data.isActive;

    if (data.password) {
      staff.password = data.password;
    }

    await staff.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'User',
      entityId: staff._id.toString(),
      details: { updatedFields: Object.keys(data).filter((k) => k !== 'password') },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return this.getById(staff._id.toString());
  }

  /**
   * Soft-delete staff member
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IUser> {
    if (user?.id && id === user.id) {
      throw AppError.forbidden('You cannot delete your own staff account.');
    }

    const staff = await this.getById(id);

    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (superAdminRole && staff.role && (staff.role as { _id?: Types.ObjectId })._id?.equals(superAdminRole._id)) {
      const adminCount = await User.countDocuments({
        role: superAdminRole._id,
        isDeleted: false,
        _id: { $ne: staff._id },
      });
      if (adminCount === 0) {
        throw AppError.conflict('Cannot delete the only remaining active Super Admin account.');
      }
    }

    return softDeleteDocument(User, id, user?.id, reqContext);
  }

  /**
   * Restore a soft-deleted staff account
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid staff identifier format');
    }

    const staff = await User.findById(id);
    if (!staff) {
      throw AppError.notFound('Staff member');
    }
    if (!staff.isDeleted) {
      return staff;
    }

    return restoreDocument(User, id, user?.id, {
      uniqueChecks: [{ field: 'email' }],
      reqContext,
    });
  }

  /**
   * Retrieve active roles for assignment dropdown
   */
  static async getActiveRoles(): Promise<Array<{ _id: Types.ObjectId; name: string; description?: string }>> {
    return Role.find({ isDeleted: false })
      .select('_id name description')
      .sort({ isSystem: -1, name: 1 })
      .lean();
  }
}
