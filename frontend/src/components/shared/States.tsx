'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { AlertCircle, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ── Loading Skeleton ───────────────────────────────────────────────────────────

export interface LoadingSkeletonProps {
  /** Number of skeleton rows to show */
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded shimmer" style={{ width: `${65 + (i % 3) * 10}%` }} />
            <div className="h-3 rounded shimmer" style={{ width: `${40 + (i % 2) * 15}%` }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
}

/** Simple rectangular skeleton block */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('rounded shimmer', className)} aria-hidden />;
}

/** Skeleton for a stat card */
export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-8 w-16" />
      <SkeletonBlock className="h-3 w-32" />
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
      role="status"
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <div className="h-6 w-6 rounded bg-muted-foreground/30" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <Button className="mt-5" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
      role="alert"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-subtle text-danger">
        <ServerCrash className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button className="mt-5" size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ── Inline error ───────────────────────────────────────────────────────────────

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-danger" role="alert">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
