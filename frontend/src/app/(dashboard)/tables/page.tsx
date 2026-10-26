import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Tables' };

export default function TablesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tables"
        description="Manage hotel and restaurant tables."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.TABLES.NEW}>
              <Plus className="h-4 w-4" />
              Add Table
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Tables CRUD — implemented in Phase 7
      </div>
    </div>
  );
}
