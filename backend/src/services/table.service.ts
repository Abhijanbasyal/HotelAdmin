import { Types, type FilterQuery } from 'mongoose';
import { Table, type ITable } from '@/models/Table.model';
import { Booking } from '@/models/Booking.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type {
  CreateTableInput,
  UpdateTableInput,
  TableQueryParams,
} from '@/validators/table.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class TableService {
  /**
   * Create a new table
   */
  static async create(
    data: CreateTableInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ITable> {
    const existing = await Table.findOne({
      tableNumber: data.tableNumber.trim().toUpperCase(),
      isDeleted: false,
    });
    if (existing) {
      throw AppError.conflict(`An active table with number "${data.tableNumber}" already exists.`);
    }

    const table = await Table.create({
      ...data,
      tableNumber: data.tableNumber.trim().toUpperCase(),
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Table',
      entityId: table._id.toString(),
      details: { tableNumber: table.tableNumber, capacity: table.capacity, location: table.location },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return table;
  }

  /**
   * List tables with pagination, search, status, location, and capacity filters
   */
  static async list(query: TableQueryParams): Promise<IPaginatedResult<ITable>> {
    const allowedSort = ['createdAt', 'tableNumber', 'capacity', 'location', 'status'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'tableNumber',
      order: 'asc',
    });

    const filter: FilterQuery<ITable> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.location) {
      filter.location = { $regex: new RegExp(query.location.trim(), 'i') };
    }

    if (query.minCapacity) {
      filter.capacity = { $gte: query.minCapacity };
    }

    if (options.search) {
      filter.$or = [
        { tableNumber: { $regex: options.search, $options: 'i' } },
        { location: { $regex: options.search, $options: 'i' } },
        { notes: { $regex: options.search, $options: 'i' } },
      ];
    }

    return paginateQuery<ITable>(Table, filter, options);
  }

  /**
   * Retrieve active tables for reservation selectors
   */
  static async getActive(minCapacity?: number): Promise<Array<{ _id: Types.ObjectId; tableNumber: string; capacity: number; location: string; status: string }>> {
    const filter: FilterQuery<ITable> = {
      isDeleted: false,
      status: { $ne: 'maintenance' },
    };

    if (minCapacity) {
      filter.capacity = { $gte: minCapacity };
    }

    return Table.find(filter)
      .select('_id tableNumber capacity location status')
      .sort({ tableNumber: 1 })
      .lean();
  }

  /**
   * Find table by ID
   */
  static async getById(id: string): Promise<ITable> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid table identifier format');
    }

    const table = await Table.findOne({ _id: id, isDeleted: false });
    if (!table) {
      throw AppError.notFound('Table');
    }

    return table;
  }

  /**
   * Update table details
   */
  static async update(
    id: string,
    data: UpdateTableInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ITable> {
    const table = await this.getById(id);

    if (data.tableNumber && data.tableNumber.trim().toUpperCase() !== table.tableNumber) {
      const conflict = await Table.findOne({
        _id: { $ne: table._id },
        tableNumber: data.tableNumber.trim().toUpperCase(),
        isDeleted: false,
      });
      if (conflict) {
        throw AppError.conflict(`An active table with number "${data.tableNumber}" already exists.`);
      }
    }

    Object.assign(table, {
      ...data,
      tableNumber: data.tableNumber ? data.tableNumber.trim().toUpperCase() : table.tableNumber,
    });
    await table.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Table',
      entityId: table._id.toString(),
      details: { updatedFields: Object.keys(data) },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return table;
  }

  /**
   * Soft-delete table with active future booking check
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ITable> {
    const table = await this.getById(id);

    // Prevent deletion if active or future bookings exist
    const activeBookingCount = await Booking.countDocuments({
      table: table._id,
      isDeleted: false,
      status: { $in: ['confirmed', 'seated'] },
      endDateTime: { $gte: new Date() },
    });

    if (activeBookingCount > 0) {
      throw AppError.conflict(
        `Cannot delete table "${table.tableNumber}". There are ${activeBookingCount} active or upcoming reservation(s) assigned to it.`
      );
    }

    return softDeleteDocument(Table, id, user?.id, reqContext);
  }

  /**
   * Restore soft-deleted table
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ITable> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid table identifier format');
    }

    const table = await Table.findById(id);
    if (!table) {
      throw AppError.notFound('Table');
    }
    if (!table.isDeleted) {
      return table;
    }

    return restoreDocument(Table, id, user?.id, {
      uniqueChecks: [{ field: 'tableNumber' }],
      reqContext,
    });
  }
}
