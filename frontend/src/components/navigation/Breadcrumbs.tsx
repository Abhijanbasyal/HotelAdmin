'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
  /** Show a spinner next to this label (for dynamic entity names) */
  isLoading?: boolean;
}

export interface BreadcrumbsProps {
  /** Explicit breadcrumb items (overrides automatic generation) */
  items?: BreadcrumbItem[];
  className?: string;
  /** Include home at the start (default true) */
  includeHome?: boolean;
}

// ── Route label map ────────────────────────────────────────────────────────────
// Map URL segments to human-readable labels.
// Dynamic segments (IDs) won't match here and fall back to "Details".

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  tables: 'Tables',
  bookings: 'Bookings',
  customers: 'Customers',
  staff: 'Staff',
  roles: 'Roles & Permissions',
  departments: 'Departments',
  settings: 'Settings',
  profile: 'Profile',
  account: 'Account',
  appearance: 'Appearance',
  'audit-log': 'Audit Log',
  new: 'New',
  edit: 'Edit',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Breadcrumbs({
  items,
  className,
  includeHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Build breadcrumbs from path segments if no explicit items provided
  const breadcrumbs: BreadcrumbItem[] = items ?? buildBreadcrumbs(pathname, includeHome);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className={cn('flex items-center', className)} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-0.5 text-sm" role="list">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-0.5">
              {index > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0"
                  aria-hidden
                />
              )}

              {crumb.isLoading ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-3 w-20 rounded shimmer" aria-hidden />
                  <span className="sr-only">Loading...</span>
                </span>
              ) : isLast ? (
                <span
                  className="font-medium text-foreground max-w-[200px] truncate"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  className={cn(
                    'text-muted-foreground hover:text-foreground transition-colors duration-150',
                    'max-w-[200px] truncate',
                    index === 0 && 'flex items-center gap-1'
                  )}
                >
                  {index === 0 && includeHome && (
                    <Home className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-muted-foreground max-w-[200px] truncate">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildBreadcrumbs(pathname: string, includeHome: boolean): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];

  if (includeHome) {
    crumbs.push({ label: 'Dashboard', href: '/dashboard' });
  }

  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Skip "dashboard" if it's first since we already added Home
    if (segment === 'dashboard' && index === 0 && includeHome) return;

    const label = SEGMENT_LABELS[segment] ?? capitalizeSegment(segment);

    crumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return crumbs;
}

/** Turns 'my-page' → 'My Page', IDs remain as-is but will be overridden by entity names */
function capitalizeSegment(segment: string): string {
  // If it looks like a MongoDB ObjectId or UUID, return a generic label
  if (/^[a-f0-9]{24}$/i.test(segment) || /^[a-f0-9-]{36}$/i.test(segment)) {
    return 'Details';
  }
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
