import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ISoftDeletable } from '@/utils/softDelete';
import './Customer.model';
import type { ICustomer } from './Customer.model';
import './Table.model';
import type { ITable } from './Table.model';
import './User.model';
import type { IUser } from './User.model';

export type BookingStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

export interface IBooking extends Document, ISoftDeletable {
  _id: Types.ObjectId;
  bookingNumber: string;
  customer: Types.ObjectId | ICustomer;
  table: Types.ObjectId | ITable;
  guestCount: number;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  startDateTime: Date;
  endDateTime: Date;
  status: BookingStatus;
  specialRequests?: string;
  createdBy?: Types.ObjectId | IUser | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      required: [true, 'Booking number is required'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    table: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table is required'],
      index: true,
    },
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [1, 'At least 1 guest is required'],
      max: [50, 'Cannot exceed 50 guests'],
      default: 2,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24-hour format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24-hour format'],
    },
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
        message: 'Invalid booking status',
      },
      default: 'confirmed',
      index: true,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [1000, 'Special requests cannot exceed 1000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// Compound indexes for conflict checking and query performance
bookingSchema.index({ table: 1, startDateTime: 1, endDateTime: 1, isDeleted: 1 });
bookingSchema.index({ bookingDate: 1, status: 1, isDeleted: 1 });
bookingSchema.index({ customer: 1, isDeleted: 1 });

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ||
  mongoose.model<IBooking>('Booking', bookingSchema);
