'use client';

import React from 'react';
import { cn } from '@/lib/cn';

// ── Input ─────────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Validation error message */
  error?: string;
  /** Icon displayed inside the left edge */
  leftElement?: React.ReactNode;
  /** Icon or button displayed inside the right edge */
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftElement, rightElement, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        {leftElement && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            {leftElement}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded border border-input bg-transparent px-3 py-2',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            leftElement && 'pl-10',
            rightElement && 'pr-10',
            hasError && 'border-danger focus-visible:ring-danger',
            className
          )}
          aria-invalid={hasError}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
            {rightElement}
          </div>
        )}
        {hasError && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[100px] w-full rounded border border-input bg-transparent px-3 py-2',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'resize-y transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'scrollbar-thin',
            hasError && 'border-danger focus-visible:ring-danger',
            className
          )}
          aria-invalid={hasError}
          {...props}
        />
        {hasError && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, children, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded border border-input bg-transparent px-3 py-2 pr-8',
            'text-sm text-foreground',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-danger focus-visible:ring-danger',
            className
          )}
          aria-invalid={hasError}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        {/* Chevron icon */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {hasError && (
          <p className="mt-1 text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ── Checkbox ──────────────────────────────────────────────────────────────────

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const inputId = id ?? `checkbox-${Math.random().toString(36).slice(2)}`;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 rounded border-input',
              'accent-primary cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              hasError && 'border-danger',
              className
            )}
            aria-invalid={hasError}
            {...props}
          />
          {(label || description) && (
            <div className="flex flex-col gap-0.5">
              {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-foreground cursor-pointer">
                  {label}
                </label>
              )}
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
        {hasError && (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
