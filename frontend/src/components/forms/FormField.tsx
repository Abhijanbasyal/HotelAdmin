'use client';

import React from 'react';
import { cn } from '@/lib/cn';

// ── FormField ─────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Unique ID linking label to input */
  id?: string;
  label: string;
  /** When true, renders a red asterisk */
  required?: boolean;
  /** Error message from React Hook Form or server */
  error?: string;
  /** Helper text below the input */
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper that provides a consistent label, required indicator,
 * hint text, and error message for any form control.
 */
export function FormField({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-label="required">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger" role="alert" id={id ? `${id}-error` : undefined}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── FormSection ───────────────────────────────────────────────────────────────

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Groups related form fields under an optional heading and description.
 */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="pb-2 border-b border-border">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

// ── FormActions ───────────────────────────────────────────────────────────────

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  /** Align buttons to the right (default) or left */
  align?: 'left' | 'right' | 'between';
}

/**
 * Container for form action buttons (Submit, Cancel, etc.)
 */
export function FormActions({ children, className, align = 'right' }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-border mt-6',
        align === 'right' && 'justify-end',
        align === 'left' && 'justify-start',
        align === 'between' && 'justify-between',
        className
      )}
    >
      {children}
    </div>
  );
}

// ── FormGrid ──────────────────────────────────────────────────────────────────

export interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}

/**
 * Responsive grid layout for form fields.
 */
export function FormGrid({ children, cols = 2, className }: FormGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
}
