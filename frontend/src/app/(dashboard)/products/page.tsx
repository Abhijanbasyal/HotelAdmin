import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Products"
        description="Manage your hotel products and inventory."
        breadcrumb={<Breadcrumbs />}
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.PRODUCTS.NEW}>
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        }
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Products CRUD — implemented in Phase 5
      </div>
    </div>
  );
}
