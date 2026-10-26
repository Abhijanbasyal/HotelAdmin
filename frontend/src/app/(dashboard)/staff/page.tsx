import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Staff' };

export default function StaffPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Staff"
        description="Manage hotel staff and employee records."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.STAFF.NEW}>
              <Plus className="h-4 w-4" />
              Add Staff
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Staff CRUD — implemented in Phase 6
      </div>
    </div>
  );
}
