'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

// ── Variants ──────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm',
    'rounded border border-transparent',
    'transition-all duration-150 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-700 active:scale-[0.98] shadow-sm',
        secondary:
          'bg-muted text-foreground hover:bg-muted/80 border-border active:scale-[0.98]',
        outline:
          'border-border bg-transparent text-foreground hover:bg-muted active:scale-[0.98]',
        ghost: 'bg-transparent text-foreground hover:bg-muted active:scale-[0.98]',
        danger:
          'bg-danger text-danger-foreground hover:bg-danger/90 active:scale-[0.98] shadow-sm',
        'danger-outline':
          'border-danger bg-transparent text-danger hover:bg-danger-subtle active:scale-[0.98]',
        success:
          'bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98] shadow-sm',
        link: 'bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-sm gap-1',
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        xl: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-xs': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** If true, renders the child element directly with button styling */
  asChild?: boolean;
  /** Shows a spinner and disables the button while true */
  isLoading?: boolean;
  /** Loading text replaces children while loading */
  loadingText?: string;
  /** Icon placed before the label */
  leftIcon?: React.ReactNode;
  /** Icon placed after the label */
  rightIcon?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      return React.cloneElement(children, {
        className: cn(buttonVariants({ variant, size }), className, children.props.className),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {leftIcon && <span aria-hidden className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span aria-hidden className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ── Icon Button variant ───────────────────────────────────────────────────────

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText'> {
  /** Accessible label for screen readers (required for icon-only buttons) */
  'aria-label': string;
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        <span aria-hidden className="shrink-0">{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ── Export variants for external composition ──────────────────────────────────
export { buttonVariants };
