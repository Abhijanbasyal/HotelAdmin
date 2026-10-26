import { Types, type FilterQuery } from 'mongoose';
import { Booking, type IBooking, type BookingStatus } from '@/models/Booking.model';
import { Table } from '@/models/Table.model';
import { Customer } from '@/models/Customer.model';
import { AuditService } from './audit.service';
import { AppError } from '@/utils/AppError';
import { paginateQuery, parsePaginationOptions, type IPaginatedResult } from '@/utils/pagination';
import { softDeleteDocument, restoreDocument, type AuditRequestContext } from '@/utils/softDelete';
import type {
  CreateBookingInput,
  UpdateBookingInput,
  BookingQueryParams,
} from '@/validators/booking.validator';
import type { AuthenticatedUser } from '@/types/auth.types';

export class BookingService {
  /**
   * Helper to parse date string & time string into start and end UTC Date objects
   */
  private static parseInterval(
    bookingDateStr: string,
    startTimeStr: string,
    endTimeStr?: string,
    durationMinutes: number = 120
  ): { startDateTime: Date; endDateTime: Date; calculatedEndTime: string } {
    const startDateTime = new Date(`${bookingDateStr}T${startTimeStr}:00Z`);

    if (isNaN(startDateTime.getTime())) {
      throw AppError.badRequest('Invalid booking date or start time');
    }

    let endDateTime: Date;
    let calculatedEndTime = endTimeStr;

    if (endTimeStr) {
      endDateTime = new Date(`${bookingDateStr}T${endTimeStr}:00Z`);
      if (isNaN(endDateTime.getTime())) {
        throw AppError.badRequest('Invalid end time');
      }
      if (endDateTime <= startDateTime) {
        // If end time is before/equal to start time, it rolls over to next day
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
      }
    } else {
      endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
      const hours = endDateTime.getUTCHours().toString().padStart(2, '0');
      const minutes = endDateTime.getUTCMinutes().toString().padStart(2, '0');
      calculatedEndTime = `${hours}:${minutes}`;
    }

    return { startDateTime, endDateTime, calculatedEndTime: calculatedEndTime! };
  }

  /**
   * Conflict Detection: checks if a table already has an active overlapping reservation
   */
  static async checkReservationConflict(
    tableId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeBookingId?: string
  ): Promise<IBooking | null> {
    const filter: FilterQuery<IBooking> = {
      table: new Types.ObjectId(tableId),
      isDeleted: false,
      status: { $in: ['confirmed', 'seated'] },
      $and: [
        { startDateTime: { $lt: endDateTime } },
        { endDateTime: { $gt: startDateTime } },
      ],
    };

    if (excludeBookingId && Types.ObjectId.isValid(excludeBookingId)) {
      filter._id = { $ne: new Types.ObjectId(excludeBookingId) };
    }

    return Booking.findOne(filter);
  }

  /**
   * Generate a unique human-friendly booking reference code
   */
  private static generateBookingNumber(): string {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BKG-${datePart}-${randomHex}`;
  }

  /**
   * Create a new booking with conflict validation
   */
  static async create(
    data: CreateBookingInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IBooking> {
    // 1. Verify customer exists and is not deleted
    const customer = await Customer.findOne({ _id: data.customer, isDeleted: false });
    if (!customer) {
      throw AppError.badRequest('Customer does not exist or has been deleted.');
    }

    // 2. Verify table exists, is not deleted, and is not under maintenance
    const table = await Table.findOne({ _id: data.table, isDeleted: false });
    if (!table) {
      throw AppError.badRequest('Table does not exist or has been deleted.');
    }
    if (table.status === 'maintenance') {
      throw AppError.badRequest(`Table "${table.tableNumber}" is currently under maintenance and cannot be booked.`);
    }

    // 3. Verify table capacity
    if (table.capacity < data.guestCount) {
      throw AppError.badRequest(
        `Table "${table.tableNumber}" has a maximum capacity of ${table.capacity} guests (${data.guestCount} requested).`
      );
    }

    // 4. Calculate datetime interval
    const { startDateTime, endDateTime, calculatedEndTime } = this.parseInterval(
      data.bookingDate,
      data.startTime,
      data.endTime,
      data.durationMinutes
    );

    // 5. Conflict prevention check
    const conflict = await this.checkReservationConflict(data.table, startDateTime, endDateTime);
    if (conflict) {
      throw AppError.conflict(
        `Table "${table.tableNumber}" is already reserved from ${conflict.startTime} to ${conflict.endTime} (Booking ref: ${conflict.bookingNumber}). Please select a different time slot or table.`
      );
    }

    const bookingNumber = this.generateBookingNumber();

    const booking = await Booking.create({
      bookingNumber,
      customer: new Types.ObjectId(data.customer),
      table: new Types.ObjectId(data.table),
      guestCount: data.guestCount,
      bookingDate: new Date(`${data.bookingDate}T00:00:00Z`),
      startTime: data.startTime,
      endTime: calculatedEndTime,
      startDateTime,
      endDateTime,
      status: data.status || 'confirmed',
      specialRequests: data.specialRequests,
      createdBy: user?.id ? new Types.ObjectId(user.id) : undefined,
      isDeleted: false,
    });

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'CREATE',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      details: {
        bookingNumber: booking.bookingNumber,
        tableNumber: table.tableNumber,
        customerName: customer.name,
        date: data.bookingDate,
        time: `${data.startTime} - ${calculatedEndTime}`,
      },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return this.getById(booking._id.toString());
  }

  /**
   * List bookings with pagination, customer and table joins, and date/status filtering
   */
  static async list(query: BookingQueryParams): Promise<IPaginatedResult<IBooking>> {
    const allowedSort = ['createdAt', 'startDateTime', 'bookingDate', 'status', 'guestCount'];
    const options = parsePaginationOptions(query as Record<string, unknown>, allowedSort, {
      field: 'startDateTime',
      order: 'asc',
    });

    const filter: FilterQuery<IBooking> = {};

    if (query.table) {
      filter.table = new Types.ObjectId(query.table);
    }

    if (query.customer) {
      filter.customer = new Types.ObjectId(query.customer);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.date) {
      const startOfDay = new Date(`${query.date}T00:00:00.000Z`);
      const endOfDay = new Date(`${query.date}T23:59:59.999Z`);
      filter.startDateTime = { $gte: startOfDay, $lte: endOfDay };
    } else if (query.startDate || query.endDate) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};
      if (query.startDate) {
        dateRange.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        dateRange.$lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
      filter.startDateTime = dateRange;
    }

    if (options.search) {
      filter.$or = [
        { bookingNumber: { $regex: options.search, $options: 'i' } },
        { specialRequests: { $regex: options.search, $options: 'i' } },
      ];
    }

    const populate = [
      { path: 'customer', select: '_id name phone email avatarUrl status' },
      { path: 'table', select: '_id tableNumber capacity location status' },
      { path: 'createdBy', select: '_id name email' },
    ];

    return paginateQuery<IBooking>(Booking, filter, options, undefined, populate);
  }

  /**
   * Find booking by ID with populated relations
   */
  static async getById(id: string): Promise<IBooking> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid booking identifier format');
    }

    const booking = await Booking.findOne({ _id: id, isDeleted: false })
      .populate('customer', '_id name phone email avatarUrl status')
      .populate('table', '_id tableNumber capacity location status')
      .populate('createdBy', '_id name email');

    if (!booking) {
      throw AppError.notFound('Booking');
    }

    return booking;
  }

  /**
   * Update booking details and re-check conflicts if time or table changed
   */
  static async update(
    id: string,
    data: UpdateBookingInput,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IBooking> {
    const booking = await this.getById(id);

    const populatedTable = booking.table as { _id?: Types.ObjectId } | Types.ObjectId;
    const currentTableId =
      populatedTable instanceof Types.ObjectId
        ? populatedTable.toString()
        : populatedTable._id
        ? populatedTable._id.toString()
        : String(populatedTable);
    const targetTableId = data.table || currentTableId;
    const targetDate = data.bookingDate || booking.bookingDate.toISOString().slice(0, 10);
    const targetStartTime = data.startTime || booking.startTime;
    const targetEndTime = data.endTime || booking.endTime;

    // Check if time or table changed
    const isScheduleChanged =
      data.table !== undefined ||
      data.bookingDate !== undefined ||
      data.startTime !== undefined ||
      data.endTime !== undefined ||
      data.durationMinutes !== undefined;

    if (isScheduleChanged) {
      const { startDateTime, endDateTime, calculatedEndTime } = this.parseInterval(
        targetDate,
        targetStartTime,
        data.endTime || (data.durationMinutes ? undefined : targetEndTime),
        data.durationMinutes || 120
      );

      const conflict = await this.checkReservationConflict(
        targetTableId,
        startDateTime,
        endDateTime,
        id
      );

      if (conflict) {
        throw AppError.conflict(
          `Table reservation conflict: table is already booked from ${conflict.startTime} to ${conflict.endTime} (Booking ref: ${conflict.bookingNumber}).`
        );
      }

      booking.startDateTime = startDateTime;
      booking.endDateTime = endDateTime;
      booking.bookingDate = new Date(`${targetDate}T00:00:00Z`);
      booking.startTime = targetStartTime;
      booking.endTime = calculatedEndTime;
    }

    if (data.table) booking.table = new Types.ObjectId(data.table);
    if (data.customer) booking.customer = new Types.ObjectId(data.customer);
    if (data.guestCount) booking.guestCount = data.guestCount;
    if (data.status) {
      await this.handleTableStatusOnBookingStatusChange(booking, data.status);
      booking.status = data.status;
    }
    if (data.specialRequests !== undefined) booking.specialRequests = data.specialRequests;

    await booking.save();

    void AuditService.logEvent({
      userId: user?.id,
      userEmail: reqContext?.userEmail,
      userName: reqContext?.userName,
      action: 'UPDATE',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      details: { updatedFields: Object.keys(data), bookingNumber: booking.bookingNumber },
      ipAddress: reqContext?.ipAddress,
      userAgent: reqContext?.userAgent,
    });

    return this.getById(booking._id.toString());
  }

  /**
   * Helper to synchronize Table status when booking transitions
   */
  private static async handleTableStatusOnBookingStatusChange(
    booking: IBooking,
    newStatus: BookingStatus
  ): Promise<void> {
    const tableId = (booking.table as { _id?: Types.ObjectId })._id || booking.table;

    if (newStatus === 'seated') {
      await Table.findByIdAndUpdate(tableId, { status: 'occupied' });
    } else if (['completed', 'cancelled', 'no_show'].includes(newStatus)) {
      // Check if any other booking is currently seated at this table
      const otherSeated = await Booking.countDocuments({
        table: tableId,
        _id: { $ne: booking._id },
        status: 'seated',
        isDeleted: false,
      });

      if (otherSeated === 0) {
        await Table.findByIdAndUpdate(tableId, { status: 'available' });
      }
    }
  }

  /**
   * Quick status transition endpoint
   */
  static async updateStatus(
    id: string,
    status: BookingStatus,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IBooking> {
    return this.update(id, { status }, user, reqContext);
  }

  /**
   * Soft-delete booking
   */
  static async softDelete(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IBooking> {
    const booking = await this.getById(id);
    await this.handleTableStatusOnBookingStatusChange(booking, 'cancelled');
    return softDeleteDocument(Booking, id, user?.id, reqContext);
  }

  /**
   * Restore a soft-deleted booking with conflict check
   */
  static async restore(
    id: string,
    user?: AuthenticatedUser,
    reqContext?: AuditRequestContext
  ): Promise<IBooking> {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid booking identifier format');
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      throw AppError.notFound('Booking');
    }
    if (!booking.isDeleted) {
      return booking;
    }

    // Verify no conflicting booking exists during this time slot
    if (['confirmed', 'seated'].includes(booking.status)) {
      const populatedTable = booking.table as { _id?: Types.ObjectId } | Types.ObjectId;
      const currentTableId =
        populatedTable instanceof Types.ObjectId
          ? populatedTable.toString()
          : populatedTable._id
          ? populatedTable._id.toString()
          : String(populatedTable);

      const conflict = await this.checkReservationConflict(
        currentTableId,
        booking.startDateTime,
        booking.endDateTime,
        id
      );

      if (conflict) {
        throw AppError.conflict(
          `Cannot restore booking "${booking.bookingNumber}": another active reservation exists during this interval (${conflict.bookingNumber}).`
        );
      }
    }

    return restoreDocument(Booking, id, user?.id, {
      uniqueChecks: [{ field: 'bookingNumber' }],
      reqContext,
    });
  }
}
