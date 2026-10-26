import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ISoftDeletable } from '@/utils/softDelete';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface ITable extends Document, ISoftDeletable {
  _id: Types.ObjectId;
  tableNumber: string;
  capacity: number;
  location: string;
  status: TableStatus;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true,
      uppercase: true,
      minlength: [1, 'Table number must be at least 1 character'],
      maxlength: [20, 'Table number cannot exceed 20 characters'],
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
      max: [50, 'Capacity cannot exceed 50 guests'],
      default: 4,
    },
    location: {
      type: String,
      required: [true, 'Location / zone is required'],
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: 'Main Dining Room',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'occupied', 'reserved', 'maintenance'],
        message: 'Invalid table status',
      },
      default: 'available',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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

tableSchema.index({ tableNumber: 1, isDeleted: 1 });
tableSchema.index({ status: 1, isDeleted: 1 });
tableSchema.index({ location: 1, isDeleted: 1 });

export const Table: Model<ITable> =
  (mongoose.models.Table as Model<ITable>) || mongoose.model<ITable>('Table', tableSchema);
