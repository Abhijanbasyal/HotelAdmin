'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// ── Variants ──────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 px-2.5 py-0.5',
    'text-xs font-medium',
    'rounded-full',
    'border',
    'whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        // Semantic status variants (FIXED colors — never change with theme)
        success: 'bg-success-subtle text-success border-success/20',
        warning: 'bg-warning-subtle text-warning border-warning/20',
        danger:  'bg-danger-subtle text-danger border-danger/20',
        info:    'bg-info-subtle text-info border-info/20',
        neutral: 'bg-muted text-muted-foreground border-border',

        // Theme-aware variants
        primary: 'bg-primary-100 text-primary-700 border-primary-200',
        outline: 'bg-transparent text-foreground border-border',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  /** Optional icon displayed before the label */
  icon?: React.ReactNode;
  /** Optional dot indicator */
  dot?: boolean;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StatusBadge({
  label,
  variant,
  size,
  icon,
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'danger' && 'bg-danger',
            variant === 'info' && 'bg-info',
            variant === 'neutral' && 'bg-muted-foreground',
            variant === 'primary' && 'bg-primary',
            variant === 'outline' && 'bg-foreground'
          )}
          aria-hidden
        />
      )}
      {icon && <span aria-hidden className="shrink-0">{icon}</span>}
      {label}
    </span>
  );
}

// ── Convenience wrappers for common status values ─────────────────────────────

/** Maps a boolean active status to a badge */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge
      variant={active ? 'success' : 'neutral'}
      label={active ? 'Active' : 'Inactive'}
      dot
    />
  );
}

/** Maps a deleted flag to a badge */
export function DeletedBadge({ deleted }: { deleted: boolean }) {
  return deleted ? <StatusBadge variant="danger" label="Deleted" dot /> : null;
}
