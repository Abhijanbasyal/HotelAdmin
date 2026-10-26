import type { Metadata } from 'next';
import { Breadcrumbs, PageHeader } from '@/components';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage your account, appearance, and system preferences."
        breadcrumb={<Breadcrumbs />}
      />
      <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        Settings — implemented in Phase 8
      </div>
    </div>
  );
}
