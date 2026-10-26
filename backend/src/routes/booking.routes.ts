import { Router } from 'express';
import { BookingController } from '@/controllers/booking.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validateRequest } from '@/middleware/validateRequest';
import { asyncHandler } from '@/utils/asyncHandler';
import { idParamSchema } from '@/validators/common.validator';
import {
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  bookingQuerySchema,
} from '@/validators/booking.validator';

export const bookingRouter = Router();

bookingRouter.use(asyncHandler(authenticate));

bookingRouter.get(
  '/',
  authorize('bookings.read'),
  validateRequest(bookingQuerySchema, 'query'),
  BookingController.list
);

bookingRouter.post(
  '/',
  authorize('bookings.create'),
  validateRequest(createBookingSchema, 'body'),
  BookingController.create
);

bookingRouter.get(
  '/:id',
  authorize('bookings.read'),
  validateRequest(idParamSchema, 'params'),
  BookingController.getById
);

bookingRouter.patch(
  '/:id',
  authorize('bookings.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateBookingSchema, 'body'),
  BookingController.update
);

bookingRouter.patch(
  '/:id/status',
  authorize('bookings.update'),
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateBookingStatusSchema, 'body'),
  BookingController.updateStatus
);

bookingRouter.delete(
  '/:id',
  authorize('bookings.delete'),
  validateRequest(idParamSchema, 'params'),
  BookingController.delete
);

bookingRouter.patch(
  '/:id/restore',
  authorize('bookings.update'),
  validateRequest(idParamSchema, 'params'),
  BookingController.restore
);
