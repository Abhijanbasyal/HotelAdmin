import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateSettingSchema = z.object({
  hotelName: z.string().trim().min(2, 'Hotel name must be at least 2 characters').max(100).optional(),
  tagline: z.string().trim().max(200).optional(),
  logoUrl: z.string().nullable().optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  phone: z.string().trim().min(5, 'Phone must be at least 5 characters').max(30).optional(),
  address: z.string().trim().max(300).optional(),
  website: z.string().trim().max(200).optional(),
  currency: z.string().trim().max(10).optional(),
  currencySymbol: z.string().trim().max(10).optional(),
  timezone: z.string().trim().optional(),
  checkInTime: z.string().regex(timeRegex, 'Check-in time must be in HH:mm 24-hour format').optional(),
  checkOutTime: z.string().regex(timeRegex, 'Check-out time must be in HH:mm 24-hour format').optional(),
  taxRate: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const parsed = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    })
    .refine((val) => val === undefined || (val >= 0 && val <= 100), {
      message: 'Tax rate must be between 0% and 100%',
    }),
  serviceChargeRate: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const parsed = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    })
    .refine((val) => val === undefined || (val >= 0 && val <= 100), {
      message: 'Service charge rate must be between 0% and 100%',
    }),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  dateFormat: z.string().trim().optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
