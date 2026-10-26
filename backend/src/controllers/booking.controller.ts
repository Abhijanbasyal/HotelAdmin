import type { Request, Response } from 'express';
import { BookingService } from '@/services/booking.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  CreateBookingInput,
  UpdateBookingInput,
  UpdateBookingStatusInput,
  BookingQueryParams,
} from '@/validators/booking.validator';

export class BookingController {
  static create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateBookingInput;
    const booking = await BookingService.create(body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.created(res, booking, 'Booking created successfully');
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as BookingQueryParams;
    const result = await BookingService.list(query);

    return ApiResponse.paginated(res, result.data, result.pagination, 'Bookings retrieved successfully');
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await BookingService.getById(id);

    return ApiResponse.success(res, booking, 'Booking retrieved successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as UpdateBookingInput;
    const booking = await BookingService.update(id, body, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, booking, 'Booking updated successfully');
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as UpdateBookingStatusInput;
    const booking = await BookingService.updateStatus(id, status, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, booking, `Booking status updated to "${status}"`);
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await BookingService.softDelete(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, booking, 'Booking soft-deleted successfully');
  });

  static restore = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await BookingService.restore(id, req.user, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userEmail: req.user?.email,
      userName: req.user?.role,
    });

    return ApiResponse.success(res, booking, 'Booking restored successfully');
  });
}
