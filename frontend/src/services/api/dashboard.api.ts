import { apiClient, type ApiResponse } from './client';

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

export interface RecentBookingItem {
  _id: string;
  id?: string;
  customer?: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
  };
  table?: {
    _id: string;
    tableNumber: string;
    location: string;
    capacity: number;
  };
  guestCount: number;
  startDateTime: string;
  endDateTime: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
  createdAt: string;
}

export interface RecentAuditLogItem {
  _id: string;
  action: string;
  resource: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface RecentActivityData {
  recentBookings: RecentBookingItem[];
  recentAuditLogs: RecentAuditLogItem[];
}

export async function getDashboardSummary(): Promise<DashboardSummaryKPI> {
  const response = await apiClient.get<ApiResponse<DashboardSummaryKPI>>('/dashboard/summary');
  return response.data.data!;
}

export async function getBookingTrends(days: number = 7): Promise<BookingTrendItem[]> {
  const response = await apiClient.get<ApiResponse<BookingTrendItem[]>>(`/dashboard/trends?days=${days}`);
  return response.data.data!;
}

export async function getTableOccupancy(): Promise<TableOccupancyStats> {
  const response = await apiClient.get<ApiResponse<TableOccupancyStats>>('/dashboard/occupancy');
  return response.data.data!;
}

export async function getRecentActivity(): Promise<RecentActivityData> {
  const response = await apiClient.get<ApiResponse<RecentActivityData>>('/dashboard/recent');
  return response.data.data!;
}

export const dashboardApi = {
  getSummary: getDashboardSummary,
  getTrends: getBookingTrends,
  getOccupancy: getTableOccupancy,
  getRecentActivity,
};
