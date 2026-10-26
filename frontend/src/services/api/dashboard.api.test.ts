import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDashboardSummary,
  getBookingTrends,
  getTableOccupancy,
  getRecentActivity,
  dashboardApi,
} from './dashboard.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('Dashboard API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardSummary calls /dashboard/summary and returns summary data', async () => {
    const mockSummary = {
      totalProducts: 25,
      totalCategories: 6,
      totalTables: 18,
      availableTables: 12,
      occupiedTables: 4,
      reservedTables: 2,
      maintenanceTables: 0,
      occupancyRate: 22,
      totalCustomers: 40,
      totalStaff: 12,
      totalDepartments: 4,
      totalBookings: 15,
      todayBookings: 5,
      todayConfirmed: 3,
      todaySeated: 2,
      todayCompleted: 0,
    };

    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockSummary },
    });

    const summary = await getDashboardSummary();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/summary');
    expect(summary.totalProducts).toBe(25);
    expect(summary.occupancyRate).toBe(22);
  });

  it('getBookingTrends calls /dashboard/trends with days parameter', async () => {
    const mockTrends = [
      { date: '2026-10-21', confirmed: 2, seated: 1, completed: 3, cancelled: 0, total: 6 },
      { date: '2026-10-22', confirmed: 4, seated: 2, completed: 4, cancelled: 1, total: 11 },
    ];

    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockTrends },
    });

    const trends = await getBookingTrends(14);

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/trends?days=14');
    expect(trends.length).toBe(2);
    expect(trends[0].total).toBe(6);
  });

  it('getTableOccupancy calls /dashboard/occupancy and returns floor metrics', async () => {
    const mockOccupancy = {
      byStatus: { available: 10, occupied: 5, reserved: 2, maintenance: 1 },
      byLocation: { Indoor: 12, Terrace: 6 },
      totalCapacity: 72,
      occupiedCapacity: 20,
      occupancyPercentage: 28,
    };

    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockOccupancy },
    });

    const occupancy = await getTableOccupancy();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/occupancy');
    expect(occupancy.totalCapacity).toBe(72);
    expect(occupancy.occupancyPercentage).toBe(28);
  });

  it('getRecentActivity calls /dashboard/recent and returns bookings & audit logs', async () => {
    const mockActivity = {
      recentBookings: [
        {
          _id: 'b-1',
          customer: { _id: 'c-1', name: 'John Doe', phone: '+1234567890' },
          table: { _id: 't-1', tableNumber: 'T-101', location: 'Indoor', capacity: 4 },
          guestCount: 2,
          startDateTime: '2026-10-27T12:00:00Z',
          endDateTime: '2026-10-27T14:00:00Z',
          status: 'confirmed',
          createdAt: '2026-10-27T10:00:00Z',
        },
      ],
      recentAuditLogs: [
        {
          _id: 'a-1',
          action: 'create',
          resource: 'booking',
          userEmail: 'staff@hoteladmin.com',
          createdAt: '2026-10-27T10:00:00Z',
        },
      ],
    };

    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockActivity },
    });

    const activity = await getRecentActivity();

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/recent');
    expect(activity.recentBookings.length).toBe(1);
    expect(activity.recentAuditLogs.length).toBe(1);
    expect(dashboardApi.getRecentActivity).toBeDefined();
  });
});
