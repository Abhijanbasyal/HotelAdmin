import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Departments' };

export default function DepartmentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Departments"
        description="Manage hotel departments and their staff assignments."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.DEPARTMENTS.NEW}>
              <Plus className="h-4 w-4" />
              Add Department
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Departments CRUD — implemented in Phase 8
      </div>
    </div>
  );
}
