import type { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: {
    template: '%s | Hotel Management',
    default: 'Dashboard | Hotel Management',
  },
};

/**
 * Dashboard route group layout.
 * All pages inside (dashboard)/ share this layout.
 */
export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
