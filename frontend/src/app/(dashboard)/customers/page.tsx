import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Customers"
        description="Manage customer records and booking history."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.CUSTOMERS.NEW}>
              <Plus className="h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Customers CRUD — implemented in Phase 6
      </div>
    </div>
  );
}
