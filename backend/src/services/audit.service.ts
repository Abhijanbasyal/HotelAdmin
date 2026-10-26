import { Types, type FilterQuery } from 'mongoose';
import { AuditLog, type IAuditLog } from '@/models/AuditLog.model';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';

export interface CreateAuditLogPayload {
  userId?: string | Types.ObjectId;
  userEmail?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string | Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class AuditService {
  /**
   * Asynchronously records an audit log event.
   * Never throws operational errors that would interrupt the parent request.
   */
  static async logEvent(payload: CreateAuditLogPayload): Promise<void> {
    try {
      const entry = {
        ...payload,
        userId: payload.userId ? new Types.ObjectId(payload.userId) : undefined,
        entityId: payload.entityId ? payload.entityId.toString() : undefined,
        action: payload.action.toUpperCase(),
      };

      await AuditLog.create(entry);
    } catch (err) {
      // Structured logging of failed audit record
      logger.error(
        {
          err,
          auditAction: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId?.toString(),
        },
        'Failed to record audit log event'
      );
    }
  }

  /**
   * Retrieves a paginated list of audit logs matching filter criteria.
   */
  static async getAuditLogs(
    query: AuditLogFilters
  ): Promise<IPaginatedResult<IAuditLog>> {
    const allowedSort = ['createdAt', 'action', 'entityType', 'userEmail'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'createdAt',
      order: 'desc',
    });

    const filter: FilterQuery<IAuditLog> = {};

    if (query.entityType) {
      filter.entityType = query.entityType;
    }

    if (query.entityId) {
      filter.entityId = query.entityId;
    }

    if (query.userId && Types.ObjectId.isValid(query.userId)) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.action) {
      filter.action = query.action.toUpperCase();
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.$lte = new Date(query.endDate);
      }
      filter.createdAt = dateFilter;
    }

    // Search query on userEmail or action
    if (options.search) {
      filter.$or = [
        { userEmail: { $regex: options.search, $options: 'i' } },
        { action: { $regex: options.search, $options: 'i' } },
        { entityType: { $regex: options.search, $options: 'i' } },
      ];
    }

    // Audit logs do not use soft deletion (options.includeDeleted is ignored)
    return paginateQuery(AuditLog, filter, { ...options, includeDeleted: true });
  }

  /**
   * Retrieves a single audit log entry by ID.
   */
  static async getAuditLogById(id: string): Promise<IAuditLog> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid audit log ID format');
    }

    const log = await AuditLog.findById(id).populate('userId', 'name email role');
    if (!log) {
      throw AppError.notFound('Audit log entry');
    }

    return log;
  }
}
