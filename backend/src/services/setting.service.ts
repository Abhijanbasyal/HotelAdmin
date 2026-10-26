import { Types } from 'mongoose';
import { Setting, type ISetting } from '@/models/Setting.model';
import { AuditService } from './audit.service';
import type { UpdateSettingInput } from '@/validators/setting.validator';
import type { AuthenticatedUser } from '@/types/auth.types';
import type { AuditRequestContext } from '@/utils/softDelete';

export class SettingService {
  /**
   * Retrieve hotel & system settings
   */
  static async getSettings(): Promise<ISetting> {
    return Setting.getSettings();
  }

  /**
   * Update hotel & system settings
   */
  static async updateSettings(
    data: UpdateSettingInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<ISetting> {
    const settings = await Setting.getSettings();

    // Assign updated fields
    Object.assign(settings, data);
    if (user?.id) {
      settings.updatedBy = new Types.ObjectId(user.id);
    }

    await settings.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Setting',
      entityId: settings._id.toString(),
      details: { updatedFields: Object.keys(data), hotelName: settings.hotelName },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return settings;
  }
}
