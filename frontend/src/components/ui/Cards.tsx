'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Stat Card ─────────────────────────────────────────────────────────────────

export interface StatCardProps {
  title: string;
  value: string | number;
  /** Description shown below the value */
  description?: string;
  /** Icon displayed in the card */
  icon?: React.ReactNode;
  /** Percentage or absolute change */
  trend?: {
    value: number;
    label?: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-5',
        'shadow-card hover:shadow-dropdown transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{description}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.direction === 'up' && (
                <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden />
              )}
              {trend.direction === 'down' && (
                <TrendingDown className="h-3.5 w-3.5 text-danger" aria-hidden />
              )}
              {trend.direction === 'neutral' && (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.direction === 'up' && 'text-success',
                  trend.direction === 'down' && 'text-danger',
                  trend.direction === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chart Card ────────────────────────────────────────────────────────────────

export interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, action, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card shadow-card',
        className
      )}
    >
      <div className="flex items-start justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="ml-4 shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Action buttons (e.g. "Add Product") */
  actions?: React.ReactNode;
  /** Breadcrumbs rendered above the title */
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
