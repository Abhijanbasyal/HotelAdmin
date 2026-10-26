import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISetting extends Document {
  // Hotel Profile
  hotelName: string;
  tagline?: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  website?: string;

  // Operations & Billing
  currency: string;
  currencySymbol: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  serviceChargeRate: number;

  // System & Preferences
  theme: 'system' | 'light' | 'dark';
  dateFormat: string;
  notificationsEnabled: boolean;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingModel extends Model<ISetting> {
  getSettings(): Promise<ISetting>;
}

const settingSchema = new Schema<ISetting, ISettingModel>(
  {
    hotelName: {
      type: String,
      required: true,
      default: 'Grand Palace Hotel & Resort',
      trim: true,
      maxlength: 100,
    },
    tagline: {
      type: String,
      default: 'Luxury Hospitality & Fine Dining',
      trim: true,
      maxlength: 200,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      default: 'contact@grandpalace.com',
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      default: '+1-555-0100',
      trim: true,
    },
    address: {
      type: String,
      required: true,
      default: '123 Ocean Boulevard, Suite 500, Miami, FL 33139',
      trim: true,
    },
    website: {
      type: String,
      default: 'https://grandpalace.example.com',
      trim: true,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '$',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
      trim: true,
    },
    checkInTime: {
      type: String,
      default: '14:00',
      trim: true,
    },
    checkOutTime: {
      type: String,
      default: '11:00',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    serviceChargeRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    theme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD',
      trim: true,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
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

/**
 * Return the singleton settings record or initialize default
 */
settingSchema.statics.getSettings = async function (): Promise<ISetting> {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const Setting: ISettingModel =
  (mongoose.models.Setting as ISettingModel) ||
  mongoose.model<ISetting, ISettingModel>('Setting', settingSchema);
