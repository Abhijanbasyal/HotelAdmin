'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  SquareStack,
  CalendarCheck,
  Users,
  Building2,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Clock,
  Plus,
  Utensils,
  ShieldCheck,
  Calendar,
  Sparkles,
  Layers,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

import {
  Breadcrumbs,
  PageHeader,
  StatCard,
  ChartCard,
  Button,
  StatusBadge,
  StatCardSkeleton,
  type BadgeVariant,
} from '@/components';
import {
  dashboardApi,
  type DashboardSummaryKPI,
  type BookingTrendItem,
  type TableOccupancyStats,
  type RecentActivityData,
} from '@/services/api/dashboard.api';
import { getSettings, type HotelSettings } from '@/services/api/setting.api';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { formatDate } from '@/utils/format';

const TABLE_STATUS_COLORS: Record<string, string> = {
  available: '#10b981', // Emerald
  occupied: '#f59e0b', // Amber
  reserved: '#3b82f6', // Blue
  maintenance: '#f43f5e', // Rose
};

export default function DashboardPage() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [trendDays, setTrendDays] = useState<number>(7);

  const [summary, setSummary] = useState<DashboardSummaryKPI | null>(null);
  const [trends, setTrends] = useState<BookingTrendItem[]>([]);
  const [occupancy, setOccupancy] = useState<TableOccupancyStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData | null>(null);
  const [hotelSettings, setHotelSettings] = useState<HotelSettings | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [sumRes, trendRes, occRes, actRes, setRes] = await Promise.allSettled([
        dashboardApi.getSummary(),
        dashboardApi.getTrends(trendDays),
        dashboardApi.getOccupancy(),
        dashboardApi.getRecentActivity(),
        getSettings(),
      ]);

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      if (trendRes.status === 'fulfilled') setTrends(trendRes.value);
      if (occRes.status === 'fulfilled') setOccupancy(occRes.value);
      if (actRes.status === 'fulfilled') setRecentActivity(actRes.value);
      if (setRes.status === 'fulfilled') setHotelSettings(setRes.value);

      if (isManualRefresh) {
        toast.success('Dashboard metrics refreshed');
      }
    } catch {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [trendDays]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle changing trend days
  const handleTrendRangeChange = async (days: number) => {
    setTrendDays(days);
    try {
      const newTrends = await dashboardApi.getTrends(days);
      setTrends(newTrends);
    } catch {
      toast.error('Failed to update trend range');
    }
  };

  // Pie chart data for table status
  const pieData = useMemo(() => {
    if (!occupancy) return [];
    return [
      { name: 'Available', value: occupancy.byStatus.available, color: TABLE_STATUS_COLORS.available },
      { name: 'Occupied', value: occupancy.byStatus.occupied, color: TABLE_STATUS_COLORS.occupied },
      { name: 'Reserved', value: occupancy.byStatus.reserved, color: TABLE_STATUS_COLORS.reserved },
      { name: 'Maintenance', value: occupancy.byStatus.maintenance, color: TABLE_STATUS_COLORS.maintenance },
    ].filter((item) => item.value > 0);
  }, [occupancy]);

  const mapBookingStatusVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'confirmed':
        return 'info';
      case 'seated':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getAuditActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
      case 'update':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
      case 'delete':
        return 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
      default:
        return 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800';
    }
  };

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Operations Dashboard"
        description="Real-time occupancy, reservation activity, and live hotel metrics"
        breadcrumb={<Breadcrumbs />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Link href={ROUTES.BOOKINGS.LIST}>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                New Booking
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Greeting Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2 border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{hotelSettings?.hotelName || 'Grand Palace Hotel & Resort'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-muted-foreground font-normal">Live Operations</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting}, {user?.name ? `${user.name}!` : 'Admin!'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Today is {todayFormatted}. Here is what&apos;s happening across your property right now.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-xs">
                <span className="text-muted-foreground">Occupancy Rate: </span>
                <span className="font-bold text-foreground">
                  {summary?.occupancyRate ?? 0}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <div className="text-xs">
                <span className="text-muted-foreground">Today&apos;s Bookings: </span>
                <span className="font-bold text-foreground">{summary?.todayBookings ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Floor Occupancy"
            value={`${summary?.occupancyRate ?? 0}%`}
            description={`${summary?.occupiedTables ?? 0} active table${(summary?.occupiedTables ?? 0) === 1 ? '' : 's'} occupied`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{
              value: summary?.occupancyRate ?? 0,
              label: 'live occupancy',
              direction: (summary?.occupancyRate ?? 0) > 0 ? 'up' : 'neutral',
            }}
          />
          <StatCard
            title="Today's Reservations"
            value={summary?.todayBookings ?? 0}
            description={`${summary?.todayConfirmed ?? 0} confirmed • ${summary?.todaySeated ?? 0} seated`}
            icon={<CalendarCheck className="h-5 w-5" />}
          />
          <StatCard
            title="Available Tables"
            value={summary?.availableTables ?? 0}
            description={`${summary?.reservedTables ?? 0} reserved • ${summary?.maintenanceTables ?? 0} maint`}
            icon={<SquareStack className="h-5 w-5" />}
          />
          <StatCard
            title="Registered Guests"
            value={summary?.totalCustomers ?? 0}
            description="Active customer accounts"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Staff On Duty"
            value={summary?.totalStaff ?? 0}
            description={`In ${summary?.totalDepartments ?? 0} operational departments`}
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard
            title="Menu Catalog"
            value={summary?.totalProducts ?? 0}
            description={`Across ${summary?.totalCategories ?? 0} product categories`}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Total Tables"
            value={summary?.totalTables ?? 0}
            description={`${occupancy?.totalCapacity ?? 0} guest seating capacity`}
            icon={<Utensils className="h-5 w-5" />}
          />
          <StatCard
            title="All-Time Bookings"
            value={summary?.totalBookings ?? 0}
            description={`${summary?.todayCompleted ?? 0} finished today`}
            icon={<Layers className="h-5 w-5" />}
          />
        </div>
      )}

      {/* ── Interactive Charts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Trends Chart (2 Columns) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Booking Trends & Volume"
            description="Daily breakdown of confirmed, seated, completed, and cancelled bookings"
            action={
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleTrendRangeChange(days)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      trendDays === days
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            }
          >
            {isMounted && (
              <div className="h-72 w-full pt-2">
                {trends.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No booking data available for this range
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorSeated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => val.slice(5)}
                        fontSize={12}
                        tickLine={false}
                        stroke="#888888"
                      />
                      <YAxis allowDecimals={false} fontSize={12} tickLine={false} stroke="#888888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-popover, #ffffff)',
                          borderColor: 'var(--color-border, #e2e8f0)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="confirmed"
                        name="Confirmed"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorConfirmed)"
                      />
                      <Area
                        type="monotone"
                        dataKey="seated"
                        name="Seated"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSeated)"
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCompleted)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Table Occupancy Donut Chart (1 Column) */}
        <div>
          <ChartCard
            title="Table Status & Floor Distribution"
            description="Real-time availability of dining and operational tables"
          >
            {isMounted && (
              <div className="flex flex-col items-center">
                <div className="h-52 w-full">
                  {pieData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No tables registered
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | string, name: string) => [`${value} tables`, name]}
                          contentStyle={{
                            backgroundColor: 'var(--color-popover, #ffffff)',
                            borderColor: 'var(--color-border, #e2e8f0)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Status Legend Pills */}
                <div className="grid grid-cols-2 gap-2 w-full mt-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {occupancy?.byStatus.available ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-muted-foreground">Occupied:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {occupancy?.byStatus.occupied ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                    <span className="text-muted-foreground">Reserved:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {occupancy?.byStatus.reserved ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                    <span className="text-muted-foreground">Maint:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {occupancy?.byStatus.maintenance ?? 0}
                    </span>
                  </div>
                </div>

                {/* Zone distribution breakdown */}
                {occupancy?.byLocation && Object.keys(occupancy.byLocation).length > 0 && (
                  <div className="w-full mt-4 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      ZONES & LOCATIONS
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(occupancy.byLocation).map(([loc, count]) => (
                        <span
                          key={loc}
                          className="px-2 py-0.5 rounded-md text-xs bg-muted text-foreground border border-border"
                        >
                          {loc}: <strong className="font-medium">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ── Quick Operational Shortcuts ────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Operational Shortcuts</h4>
              <p className="text-xs text-muted-foreground">Fast navigation for hotel front desk & admins</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={ROUTES.BOOKINGS.LIST}>
              <Button size="sm" variant="outline" leftIcon={<CalendarCheck className="h-3.5 w-3.5" />}>
                Manage Bookings
              </Button>
            </Link>
            <Link href={ROUTES.TABLES.LIST}>
              <Button size="sm" variant="outline" leftIcon={<SquareStack className="h-3.5 w-3.5" />}>
                Table Layout
              </Button>
            </Link>
            <Link href={ROUTES.CUSTOMERS.LIST}>
              <Button size="sm" variant="outline" leftIcon={<Users className="h-3.5 w-3.5" />}>
                Guest Directory
              </Button>
            </Link>
            <Link href={ROUTES.PRODUCTS.LIST}>
              <Button size="sm" variant="outline" leftIcon={<Package className="h-3.5 w-3.5" />}>
                Catalog Menu
              </Button>
            </Link>
            <Link href={ROUTES.SETTINGS.ROOT}>
              <Button size="sm" variant="ghost" leftIcon={<SettingsIcon className="h-3.5 w-3.5" />}>
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Activity & Bookings Feeds Row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings Feed */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Reservations</h3>
            </div>
            <Link
              href={ROUTES.BOOKINGS.LIST}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1">
            {recentActivity?.recentBookings && recentActivity.recentBookings.length > 0 ? (
              <div className="divide-y divide-border">
                {recentActivity.recentBookings.map((b) => (
                  <div key={b._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {b.customer?.name ? b.customer.name.slice(0, 2).toUpperCase() : 'BK'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {b.customer?.name || 'Walk-in Guest'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>Table {b.table?.tableNumber || 'N/A'}</span>
                          <span>•</span>
                          <span>{b.guestCount} Guests</span>
                          <span>•</span>
                          <span>{b.table?.location || 'General'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                      <StatusBadge
                        variant={mapBookingStatusVariant(b.status)}
                        label={b.status.toUpperCase()}
                        size="sm"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(b.startDateTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No recent bookings recorded
              </div>
            )}
          </div>
        </div>

        {/* Live Audit Trail / Recent Activity Feed */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Operational Audit Trail</h3>
            </div>
            <Link
              href="/audit-logs"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              View logs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-0 flex-1">
            {recentActivity?.recentAuditLogs && recentActivity.recentAuditLogs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentActivity.recentAuditLogs.map((log) => (
                  <div key={log._id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 mt-0.5 ${getAuditActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        <span className="capitalize">{log.resource}</span> modified by{' '}
                        <strong>{log.userEmail || log.userName || 'System'}</strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ipAddress && <span>• IP: {log.ipAddress}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No recent audit events logged
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
