import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  tokenHash: string;
  userId: Types.ObjectId;
  family: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL cleanup when expiresAt is reached
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ family: 1, isRevoked: 1 });

export const RefreshToken: Model<IRefreshToken> =
  (mongoose.models.RefreshToken as Model<IRefreshToken>) ||
  mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
