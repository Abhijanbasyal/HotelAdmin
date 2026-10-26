import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Roles & Permissions' };

export default function RolesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Roles & Permissions"
        description="Configure system roles and access permissions."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.ROLES.NEW}>
              <Plus className="h-4 w-4" />
              Create Role
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Roles & Permissions — implemented in Phase 8
      </div>
    </div>
  );
}
