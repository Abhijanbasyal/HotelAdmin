import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import { dashboardApi } from '@/services/api/dashboard.api';
import * as settingApi from '@/services/api/setting.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div className="recharts-responsive-mock">{children}</div>
    ),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u-1',
      name: 'Alice Smith',
      email: 'alice@hoteladmin.com',
      role: 'admin',
    },
    isAuthenticated: true,
  }),
}));

vi.mock('@/services/api/dashboard.api', () => ({
  dashboardApi: {
    getSummary: vi.fn(),
    getTrends: vi.fn(),
    getOccupancy: vi.fn(),
    getRecentActivity: vi.fn(),
  },
}));

vi.mock('@/services/api/setting.api', () => ({
  getSettings: vi.fn(),
}));

describe('DashboardPage Component', () => {
  const mockSummary = {
    totalProducts: 48,
    totalCategories: 8,
    totalTables: 24,
    availableTables: 16,
    occupiedTables: 6,
    reservedTables: 2,
    maintenanceTables: 0,
    occupancyRate: 25,
    totalCustomers: 120,
    totalStaff: 18,
    totalDepartments: 5,
    totalBookings: 84,
    todayBookings: 12,
    todayConfirmed: 8,
    todaySeated: 3,
    todayCompleted: 1,
  };

  const mockTrends = [
    { date: '2026-10-25', confirmed: 5, seated: 2, completed: 4, cancelled: 1, total: 12 },
    { date: '2026-10-26', confirmed: 8, seated: 3, completed: 5, cancelled: 0, total: 16 },
  ];

  const mockOccupancy = {
    byStatus: { available: 16, occupied: 6, reserved: 2, maintenance: 0 },
    byLocation: { Indoor: 14, Terrace: 6, VIP: 4 },
    totalCapacity: 96,
    occupiedCapacity: 24,
    occupancyPercentage: 25,
  };

  const mockRecentActivity = {
    recentBookings: [
      {
        _id: 'b-101',
        customer: { _id: 'c-1', name: 'Sophia Loren', phone: '+1234567890' },
        table: { _id: 't-1', tableNumber: 'T-12', location: 'Terrace', capacity: 4 },
        guestCount: 3,
        startDateTime: '2026-10-27T19:00:00.000Z',
        endDateTime: '2026-10-27T21:00:00.000Z',
        status: 'confirmed' as const,
        createdAt: '2026-10-27T08:00:00.000Z',
      },
    ],
    recentAuditLogs: [
      {
        _id: 'a-201',
        action: 'create',
        resource: 'booking',
        userEmail: 'concierge@hotel.com',
        userName: 'Receptionist',
        ipAddress: '127.0.0.1',
        createdAt: '2026-10-27T08:30:00.000Z',
      },
    ],
  };

  const mockSettings = {
    id: 's-1',
    _id: 's-1',
    hotelName: 'Grand Palace Hotel & Resort',
    currency: 'USD',
    currencySymbol: '$',
    timezone: 'UTC',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    taxRate: 10,
    serviceChargeRate: 5,
    theme: 'system' as const,
    dateFormat: 'YYYY-MM-DD',
    notificationsEnabled: true,
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dashboardApi.getSummary as ReturnType<typeof vi.fn>).mockResolvedValue(mockSummary);
    (dashboardApi.getTrends as ReturnType<typeof vi.fn>).mockResolvedValue(mockTrends);
    (dashboardApi.getOccupancy as ReturnType<typeof vi.fn>).mockResolvedValue(mockOccupancy);
    (dashboardApi.getRecentActivity as ReturnType<typeof vi.fn>).mockResolvedValue(mockRecentActivity);
    (settingApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue(mockSettings);
  });

  it('renders operations dashboard with user greeting and hotel name', async () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { name: /Operations Dashboard/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Alice Smith!/i)).toBeInTheDocument();
      expect(screen.getByText(/Grand Palace Hotel & Resort/i)).toBeInTheDocument();
    });
  });

  it('displays real-time KPI metrics correctly', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Floor Occupancy')).toBeInTheDocument();
      expect(screen.getByText("Today's Reservations")).toBeInTheDocument();
      expect(screen.getByText('Available Tables')).toBeInTheDocument();
      expect(screen.getByText('Registered Guests')).toBeInTheDocument();
      expect(screen.getByText('Staff On Duty')).toBeInTheDocument();
      expect(screen.getByText('Menu Catalog')).toBeInTheDocument();
    });

    // Check specific values
    expect(screen.getAllByText('25%').length).toBeGreaterThan(0);
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('48')).toBeInTheDocument();
  });

  it('renders recent reservations and operational audit trail', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Sophia Loren')).toBeInTheDocument();
      expect(screen.getByText(/Table T-12/i)).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
      expect(screen.getByText(/concierge@hotel\.com/i)).toBeInTheDocument();
    });
  });

  it('refreshes metrics when clicking the Refresh button', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(dashboardApi.getSummary).toHaveBeenCalledTimes(2);
    });
  });

  it('switches booking trends timeframe when clicking days buttons', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Booking Trends & Volume')).toBeInTheDocument();
    });

    const day14Btn = screen.getByRole('button', { name: '14D' });
    fireEvent.click(day14Btn);

    await waitFor(() => {
      expect(dashboardApi.getTrends).toHaveBeenCalledWith(14);
    });
  });
});
