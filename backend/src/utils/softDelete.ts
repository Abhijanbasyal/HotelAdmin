import { Types, type Model, type Document, Schema } from 'mongoose';
import { AppError } from './AppError';
import { AuditService } from '@/services/audit.service';

export interface ISoftDeletable {
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
}

export interface AuditRequestContext {
  ipAddress?: string;
  userAgent?: string;
  userEmail?: string;
  userName?: string;
}

export interface UniqueConflictCheck<T> {
  field: keyof T | string;
  value?: unknown;
  message?: string;
}

export interface RestoreDocumentOptions<T> {
  uniqueChecks?: UniqueConflictCheck<T>[];
  reqContext?: AuditRequestContext;
}

/**
 * Reusable schema fields to attach to any Mongoose schema that supports soft deletion.
 */
export const softDeleteSchemaFields = {
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
};

/**
 * Soft deletes a record by updating `isDeleted: true`, `deletedAt`, and `deletedBy`.
 * Preserves all underlying database documents, references, and audit history.
 */
export async function softDeleteDocument<T extends Document & ISoftDeletable>(
  model: Model<T>,
  id: string | Types.ObjectId,
  userId?: string | Types.ObjectId,
  reqContext?: AuditRequestContext
): Promise<T> {
  if (!Types.ObjectId.isValid(id.toString())) {
    throw AppError.badRequest(`Invalid identifier format: ${String(id)}`);
  }

  const doc = await model.findById(id);
  if (!doc) {
    throw AppError.notFound(model.modelName);
  }

  if (doc.isDeleted) {
    throw AppError.badRequest(`${model.modelName} is already deleted.`);
  }

  doc.isDeleted = true;
  doc.deletedAt = new Date();
  doc.deletedBy = userId ? new Types.ObjectId(userId) : null;

  await doc.save();

  // Record audit trail
  void AuditService.logEvent({
    userId: userId?.toString(),
    userEmail: reqContext?.userEmail,
    userName: reqContext?.userName,
    action: 'DELETE',
    entityType: model.modelName,
    entityId: doc._id.toString(),
    details: {
      softDeleted: true,
      deletedAt: doc.deletedAt,
    },
    ipAddress: reqContext?.ipAddress,
    userAgent: reqContext?.userAgent,
  });

  return doc;
}

/**
 * Restores a soft-deleted document back to active status (`isDeleted: false`).
 * Automatically performs unique conflict validation to prevent restoring duplicates.
 */
export async function restoreDocument<T extends Document & ISoftDeletable>(
  model: Model<T>,
  id: string | Types.ObjectId,
  userId?: string | Types.ObjectId,
  options?: RestoreDocumentOptions<T>
): Promise<T> {
  if (!Types.ObjectId.isValid(id.toString())) {
    throw AppError.badRequest(`Invalid identifier format: ${String(id)}`);
  }

  const doc = await model.findById(id);
  if (!doc) {
    throw AppError.notFound(model.modelName);
  }

  if (!doc.isDeleted) {
    throw AppError.badRequest(`${model.modelName} is not deleted.`);
  }

  // Conflict checking: Ensure unique constraints are not violated by restoring
  if (options?.uniqueChecks && options.uniqueChecks.length > 0) {
    for (const check of options.uniqueChecks) {
      const fieldName = String(check.field);
      const val =
        check.value !== undefined
          ? check.value
          : (doc.get(fieldName) as unknown);

      if (val !== undefined && val !== null) {
        // Look for an existing ACTIVE record with this same unique value
        const conflict = await model.findOne({
          [fieldName]: val,
          isDeleted: false,
          _id: { $ne: doc._id },
        });

        if (conflict) {
          throw AppError.conflict(
            check.message ||
              `Cannot restore: an active ${model.modelName} with ${fieldName} "${String(val)}" already exists.`
          );
        }
      }
    }
  }

  doc.isDeleted = false;
  doc.deletedAt = null;
  doc.deletedBy = null;

  await doc.save();

  // Record audit trail
  void AuditService.logEvent({
    userId: userId?.toString(),
    userEmail: options?.reqContext?.userEmail,
    userName: options?.reqContext?.userName,
    action: 'RESTORE',
    entityType: model.modelName,
    entityId: doc._id.toString(),
    details: {
      restored: true,
      restoredAt: new Date(),
    },
    ipAddress: options?.reqContext?.ipAddress,
    userAgent: options?.reqContext?.userAgent,
  });

  return doc;
}
