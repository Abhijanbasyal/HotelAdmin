import { Types, type FilterQuery } from 'mongoose';
import { Role, type IRole } from '@/models/Role.model';
import { User } from '@/models/User.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import {
  AVAILABLE_PERMISSIONS,
  type CreateRoleInput,
  type UpdateRoleInput,
  type RoleQueryParams,
} from '@/validators/role.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class RoleService {
  /**
   * Return predefined system permissions list
   */
  static getPermissionsList() {
    return AVAILABLE_PERMISSIONS;
  }

  /**
   * Create a new custom role
   */
  static async create(
    data: CreateRoleInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IRole> {
    const existing = await Role.findOne({
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
      isDeleted: false,
    });

    if (existing) {
      throw AppError.conflict(`Role with name "${data.name}" already exists.`);
    }

    const role = await Role.create({
      name: data.name.trim(),
      description: data.description?.trim(),
      permissions: data.permissions,
      isSystem: false,
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Role',
      entityId: role._id.toString(),
      details: { name: role.name, permissionsCount: role.permissions.length },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return role;
  }

  /**
   * List roles with pagination
   */
  static async list(query: RoleQueryParams): Promise<IPaginatedResult<IRole>> {
    const allowedSort = ['createdAt', 'name', 'isSystem'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<IRole> = {};

    if (query.isSystem !== undefined) {
      filter.isSystem = query.isSystem;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    return paginateQuery<IRole>(Role, filter, options);
  }

  /**
   * List all active non-deleted roles
   */
  static async getActive(): Promise<IRole[]> {
    return Role.find({ isDeleted: false }).sort({ isSystem: -1, name: 1 });
  }

  /**
   * Get role by ID
   */
  static async getById(id: string): Promise<IRole> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid role identifier format');
    }

    const role = await Role.findOne({ _id: id, isDeleted: false });
    if (!role) {
      throw AppError.notFound('Role');
    }

    return role;
  }

  /**
   * Update a role
   */
  static async update(
    id: string,
    data: UpdateRoleInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IRole> {
    const role = await this.getById(id);

    if (data.name && data.name.trim() !== role.name) {
      if (role.isSystem) {
        throw AppError.badRequest('System role names cannot be renamed.');
      }

      const duplicate = await Role.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
        isDeleted: false,
      });

      if (duplicate) {
        throw AppError.conflict(`Role with name "${data.name}" already exists.`);
      }

      role.name = data.name.trim();
    }

    if (data.description !== undefined) {
      role.description = data.description.trim();
    }

    if (data.permissions !== undefined) {
      // Super Admin permissions must not be stripped
      if (role.name === 'Super Admin' && !data.permissions.includes('*')) {
        throw AppError.badRequest('Super Admin role must retain the wildcard "*" permission.');
      }
      role.permissions = data.permissions;
    }

    await role.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Role',
      entityId: role._id.toString(),
      details: { updatedFields: Object.keys(data), name: role.name },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return role;
  }

  /**
   * Soft delete a custom role
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IRole> {
    const role = await this.getById(id);

    if (role.isSystem) {
      throw AppError.badRequest(`System role "${role.name}" cannot be deleted.`);
    }

    const assignedCount = await User.countDocuments({ role: role._id, isDeleted: false });
    if (assignedCount > 0) {
      throw AppError.badRequest(
        `Cannot delete role "${role.name}": it is currently assigned to ${assignedCount} active user(s). Please reassign staff before deleting this role.`
      );
    }

    return softDeleteDocument(Role, id, user?.id, reqContext);
  }

  /**
   * Restore a soft-deleted role
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IRole> {
    return restoreDocument(Role, id, user?.id, {
      uniqueChecks: [{ field: 'name' }],
      reqContext,
    });
  }
}
