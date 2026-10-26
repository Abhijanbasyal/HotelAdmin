import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { ISoftDeletable } from '@/utils/softDelete';

export type AssetEntityType =
  | 'Product'
  | 'Category'
  | 'User'
  | 'Staff'
  | 'Customer'
  | 'General'
  | 'Document';

export type AssetVisibility = 'public' | 'private';

export interface IAsset extends Document, ISoftDeletable {
  _id: Types.ObjectId;
  ownerId?: Types.ObjectId;
  entityType: AssetEntityType;
  entityId?: string;
  originalFilename: string;
  storageKey: string;
  storageProvider: 'local' | 's3' | 'gcs';
  mimeType: string;
  fileSize: number;
  imageWidth?: number;
  imageHeight?: number;
  videoDuration?: number;
  visibility: AssetVisibility;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

const assetSchema = new Schema<IAsset>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ['Product', 'Category', 'User', 'Staff', 'Customer', 'General', 'Document'],
      index: true,
    },
    entityId: {
      type: String,
      trim: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
      maxlength: [255, 'Filename cannot exceed 255 characters'],
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'gcs'],
      default: 'local',
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [0, 'File size cannot be negative'],
    },
    imageWidth: {
      type: Number,
      min: 0,
    },
    imageHeight: {
      type: Number,
      min: 0,
    },
    videoDuration: {
      type: Number,
      min: 0,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
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
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for resolved asset access URL
assetSchema.virtual('url').get(function (this: IAsset) {
  return `/api/v1/assets/file/${this.storageKey}`;
});

// Compound indexes
assetSchema.index({ entityType: 1, entityId: 1, isDeleted: 1 });
assetSchema.index({ ownerId: 1, isDeleted: 1 });
assetSchema.index({ createdAt: -1 });

export const Asset: Model<IAsset> =
  (mongoose.models.Asset as Model<IAsset>) || mongoose.model<IAsset>('Asset', assetSchema);
