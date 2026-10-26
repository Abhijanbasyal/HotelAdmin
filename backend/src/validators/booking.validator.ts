import { z } from 'zod';
import { paginationQuerySchema, objectIdSchema } from './common.validator';

export const bookingStatusEnum = z.enum([
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show',
]);

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBookingSchema = z.object({
  customer: objectIdSchema,
  table: objectIdSchema,
  guestCount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'Guest count must be between 1 and 50',
    }),
  bookingDate: z
    .string({ required_error: 'Booking date is required' })
    .regex(dateFormatRegex, 'Booking date must be in YYYY-MM-DD format'),
  startTime: z
    .string({ required_error: 'Start time is required' })
    .regex(timeFormatRegex, 'Start time must be in HH:mm 24-hour format'),
  endTime: z
    .string()
    .regex(timeFormatRegex, 'End time must be in HH:mm 24-hour format')
    .optional(),
  durationMinutes: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return 120;
      const num = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(num) || num < 30 ? 120 : num;
    })
    .default(120),
  specialRequests: z.string().trim().max(1000).optional(),
  status: bookingStatusEnum.default('confirmed'),
});

export const updateBookingSchema = z.object({
  table: objectIdSchema.optional(),
  customer: objectIdSchema.optional(),
  guestCount: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const parsed = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }),
  bookingDate: z.string().regex(dateFormatRegex).optional(),
  startTime: z.string().regex(timeFormatRegex).optional(),
  endTime: z.string().regex(timeFormatRegex).optional(),
  durationMinutes: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === '') return undefined;
      const num = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(num) ? undefined : num;
    }),
  specialRequests: z.string().trim().max(1000).optional(),
  status: bookingStatusEnum.optional(),
});

export const bookingQuerySchema = paginationQuerySchema.extend({
  table: objectIdSchema.optional(),
  customer: objectIdSchema.optional(),
  status: bookingStatusEnum.optional(),
  date: z.string().regex(dateFormatRegex).optional(),
  startDate: z.string().regex(dateFormatRegex).optional(),
  endDate: z.string().regex(dateFormatRegex).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: bookingStatusEnum,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type BookingQueryParams = z.infer<typeof bookingQuerySchema>;
