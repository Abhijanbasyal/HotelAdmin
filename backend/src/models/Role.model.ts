import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ISoftDeletable } from '@/utils/softDelete';

export interface IRole extends Document, ISoftDeletable {
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [50, 'Role name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (perms: string[]) => Array.isArray(perms),
        message: 'Permissions must be an array of strings',
      },
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const plain = ret as Record<string, unknown>;
        delete plain.__v;
        return plain;
      },
    },
  }
);

roleSchema.index({ name: 1, isDeleted: 1 });

export const Role: Model<IRole> =
  (mongoose.models.Role as Model<IRole>) || mongoose.model<IRole>('Role', roleSchema);
