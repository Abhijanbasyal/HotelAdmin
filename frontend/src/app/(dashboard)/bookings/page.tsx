import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Bookings' };

export default function BookingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bookings"
        description="View and manage customer bookings."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.BOOKINGS.NEW}>
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Bookings CRUD — implemented in Phase 7
      </div>
    </div>
  );
}
