import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ISoftDeletable } from '@/utils/softDelete';

export type CustomerIdType = 'passport' | 'id_card' | 'driving_license' | 'other';
export type CustomerStatus = 'active' | 'inactive';

export interface ICustomer extends Document, ISoftDeletable {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  idType?: CustomerIdType;
  idNumber?: string;
  notes?: string;
  avatarUrl?: string;
  status: CustomerStatus;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      default: undefined,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      minlength: [5, 'Phone number must be at least 5 characters'],
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
      index: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    idType: {
      type: String,
      enum: {
        values: ['passport', 'id_card', 'driving_license', 'other'],
        message: 'Invalid identification type',
      },
      default: 'passport',
    },
    idNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'ID number cannot exceed 50 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    avatarUrl: {
      type: String,
      trim: true,
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

customerSchema.index({ phone: 1, isDeleted: 1 });
customerSchema.index({ email: 1, isDeleted: 1 });
customerSchema.index({ name: 1, isDeleted: 1 });

export const Customer: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) ||
  mongoose.model<ICustomer>('Customer', customerSchema);
