import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Categories"
        description="Manage product categories."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.CATEGORIES.NEW}>
              <Plus className="h-4 w-4" />
              Add Category
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Categories CRUD — implemented in Phase 5
      </div>
    </div>
  );
}
