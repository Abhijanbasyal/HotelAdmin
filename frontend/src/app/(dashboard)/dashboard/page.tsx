import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { PageHeader } from '@/components/ui/Cards';
import {
  Package,
  Tag,
  SquareStack,
  CalendarCheck,
  Users,
  UserCog,
  Building2,
} from 'lucide-react';
import { StatCard, ChartCard } from '@/components/ui/Cards';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Dashboard page — Phase 1 scaffold with placeholder data.
 * Real backend data, charts, and filters will be wired in Phase 9.
 */
export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your hotel operations."
        breadcrumb={<Breadcrumbs />}
      />

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Products"
          value="—"
          description="Awaiting live data"
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title="Categories"
          value="—"
          description="Awaiting live data"
          icon={<Tag className="h-5 w-5" />}
        />
        <StatCard
          title="Tables"
          value="—"
          description="Awaiting live data"
          icon={<SquareStack className="h-5 w-5" />}
        />
        <StatCard
          title="Bookings Today"
          value="—"
          description="Awaiting live data"
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Customers"
          value="—"
          description="Awaiting live data"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Staff Members"
          value="—"
          description="Awaiting live data"
          icon={<UserCog className="h-5 w-5" />}
        />
        <StatCard
          title="Departments"
          value="—"
          description="Awaiting live data"
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Booking Activity"
          description="Bookings over the last 30 days"
        >
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground rounded-lg bg-muted/30 border border-dashed border-border">
            Chart will be connected in Phase 9
          </div>
        </ChartCard>

        <ChartCard
          title="Table Occupancy"
          description="Current table availability status"
        >
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground rounded-lg bg-muted/30 border border-dashed border-border">
            Chart will be connected in Phase 9
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
