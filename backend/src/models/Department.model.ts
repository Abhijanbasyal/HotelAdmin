import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ISoftDeletable } from '@/utils/softDelete';

export interface IDepartment extends Document, ISoftDeletable {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      minlength: [2, 'Department name must be at least 2 characters'],
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      minlength: [2, 'Code must be at least 2 characters'],
      maxlength: [20, 'Code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active or inactive',
      },
      default: 'active',
      index: true,
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

departmentSchema.index({ name: 1, isDeleted: 1 });
departmentSchema.index({ code: 1, isDeleted: 1 });

export const Department: Model<IDepartment> =
  (mongoose.models.Department as Model<IDepartment>) ||
  mongoose.model<IDepartment>('Department', departmentSchema);
