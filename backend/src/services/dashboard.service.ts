import { Product } from '@/models/Product.model';
import { Category } from '@/models/Category.model';
import { Table, type ITable } from '@/models/Table.model';
import { Customer } from '@/models/Customer.model';
import { User } from '@/models/User.model';
import { Department } from '@/models/Department.model';
import { Booking, type IBooking } from '@/models/Booking.model';
import { AuditLog, type IAuditLog } from '@/models/AuditLog.model';

export interface DashboardSummaryKPI {
  totalProducts: number;
  totalCategories: number;
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  maintenanceTables: number;
  occupancyRate: number;
  totalCustomers: number;
  totalStaff: number;
  totalDepartments: number;
  totalBookings: number;
  todayBookings: number;
  todayConfirmed: number;
  todaySeated: number;
  todayCompleted: number;
}

export interface BookingTrendItem {
  date: string;
  confirmed: number;
  seated: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface TableOccupancyStats {
  byStatus: {
    available: number;
    occupied: number;
    reserved: number;
    maintenance: number;
  };
  byLocation: Record<string, number>;
  totalCapacity: number;
  occupiedCapacity: number;
  occupancyPercentage: number;
}

export interface RecentActivityData {
  recentBookings: IBooking[];
  recentAuditLogs: IAuditLog[];
}

export class DashboardService {
  /**
   * Aggregate all high-level operational KPIs
   */
  static async getSummary(): Promise<DashboardSummaryKPI> {
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));

    const [
      totalProducts,
      totalCategories,
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      maintenanceTables,
      totalCustomers,
      totalStaff,
      totalDepartments,
      totalBookings,
      todayBookings,
      todayConfirmed,
      todaySeated,
      todayCompleted,
    ] = await Promise.all([
      Product.countDocuments({ isDeleted: false }),
      Category.countDocuments({ isDeleted: false }),
      Table.countDocuments({ isDeleted: false }),
      Table.countDocuments({ isDeleted: false, status: 'available' }),
      Table.countDocuments({ isDeleted: false, status: 'occupied' }),
      Table.countDocuments({ isDeleted: false, status: 'reserved' }),
      Table.countDocuments({ isDeleted: false, status: 'maintenance' }),
      Customer.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false }),
      Department.countDocuments({ isDeleted: false }),
      Booking.countDocuments({ isDeleted: false }),
      Booking.countDocuments({
        isDeleted: false,
        startDateTime: { $gte: startOfDay, $lte: endOfDay },
      }),
      Booking.countDocuments({
        isDeleted: false,
        status: 'confirmed',
        startDateTime: { $gte: startOfDay, $lte: endOfDay },
      }),
      Booking.countDocuments({
        isDeleted: false,
        status: 'seated',
        startDateTime: { $gte: startOfDay, $lte: endOfDay },
      }),
      Booking.countDocuments({
        isDeleted: false,
        status: 'completed',
        startDateTime: { $gte: startOfDay, $lte: endOfDay },
      }),
    ]);

    const activeOperationalTables = totalTables - maintenanceTables;
    const occupancyRate =
      activeOperationalTables > 0
        ? Math.min(100, Math.round((occupiedTables / activeOperationalTables) * 100))
        : 0;

    return {
      totalProducts,
      totalCategories,
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      maintenanceTables,
      occupancyRate,
      totalCustomers,
      totalStaff,
      totalDepartments,
      totalBookings,
      todayBookings,
      todayConfirmed,
      todaySeated,
      todayCompleted,
    };
  }

  /**
   * Aggregate daily booking trends over the specified window (default: 7 days)
   */
  static async getBookingTrends(days: number = 7): Promise<BookingTrendItem[]> {
    const clampedDays = Math.max(1, Math.min(days, 30));
    const now = new Date();
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (clampedDays - 1), 0, 0, 0, 0)
    );

    // Build timeline template
    const datesMap = new Map<string, BookingTrendItem>();
    for (let i = 0; i < clampedDays; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      datesMap.set(dateStr, {
        date: dateStr,
        confirmed: 0,
        seated: 0,
        completed: 0,
        cancelled: 0,
        total: 0,
      });
    }

    const aggregation = await Booking.aggregate<{
      _id: { date: string; status: string };
      count: number;
    }>([
      {
        $match: {
          isDeleted: false,
          startDateTime: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startDateTime' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    for (const item of aggregation) {
      const record = datesMap.get(item._id.date);
      if (record) {
        const count = item.count;
        record.total += count;
        if (item._id.status === 'confirmed') record.confirmed += count;
        else if (item._id.status === 'seated') record.seated += count;
        else if (item._id.status === 'completed') record.completed += count;
        else if (item._id.status === 'cancelled') record.cancelled += count;
      }
    }

    return Array.from(datesMap.values());
  }

  /**
   * Real-time floor occupancy and location breakdown
   */
  static async getTableOccupancy(): Promise<TableOccupancyStats> {
    const tables = await Table.find({ isDeleted: false });

    const byStatus = {
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
    };

    const byLocation: Record<string, number> = {};
    let totalCapacity = 0;
    let occupiedCapacity = 0;

    for (const table of tables as ITable[]) {
      if (table.status in byStatus) {
        byStatus[table.status as keyof typeof byStatus] += 1;
      }

      byLocation[table.location] = (byLocation[table.location] || 0) + 1;

      if (table.status !== 'maintenance') {
        totalCapacity += table.capacity;
        if (table.status === 'occupied') {
          occupiedCapacity += table.capacity;
        }
      }
    }

    const occupancyPercentage =
      totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0;

    return {
      byStatus,
      byLocation,
      totalCapacity,
      occupiedCapacity,
      occupancyPercentage,
    };
  }

  /**
   * Fetch recent operational activities (latest bookings & audit trails)
   */
  static async getRecentActivity(): Promise<RecentActivityData> {
    const [recentBookings, recentAuditLogs] = await Promise.all([
      Booking.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'name phone email avatarUrl')
        .populate('table', 'tableNumber location capacity'),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    return {
      recentBookings,
      recentAuditLogs,
    };
  }
}
