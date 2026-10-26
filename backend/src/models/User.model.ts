import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import argon2 from 'argon2';
import './Role.model';
import type { IRole } from './Role.model';
import './Department.model';
import type { IDepartment } from './Department.model';

import type { ISoftDeletable } from '@/utils/softDelete';

export interface IUser extends Document, ISoftDeletable {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: Types.ObjectId | IRole;
  department?: Types.ObjectId | IDepartment | null;
  phone?: string;
  jobTitle?: string;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(plainText: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password hash in queries by default
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'User role is required'],
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters'],
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
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
        delete plain.password;
        delete plain.__v;
        return plain;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1, isDeleted: 1 });

// Pre-save hook: automatically hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Instance method: verify password against stored Argon2 hash
userSchema.methods.verifyPassword = async function (plainText: string): Promise<boolean> {
  const currentPassword = this.password as string | undefined;
  if (!currentPassword) return false;
  try {
    return await argon2.verify(currentPassword, plainText);
  } catch {
    return false;
  }
};

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);
