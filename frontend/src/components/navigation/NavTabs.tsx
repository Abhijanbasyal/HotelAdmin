'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface NavTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavTabsProps<T extends string = string> {
  tabs: NavTabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NavTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
}: NavTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="Navigation tabs"
      className={cn('flex items-center border-b border-border gap-2 sm:gap-6 overflow-x-auto scrollbar-none', className)}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'group relative flex items-center gap-2 whitespace-nowrap transition-colors duration-150',
              'font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-sm',
              size === 'sm' && 'pb-2 text-xs',
              size === 'md' && 'pb-3 text-sm',
              size === 'lg' && 'pb-3.5 text-base',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground',
              tab.disabled && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
            )}
          >
            {tab.icon && (
              <span
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden
              >
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>

            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                )}
              >
                {tab.badge}
              </span>
            )}

            {/* Active underline indicator */}
            <span
              className={cn(
                'absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-200',
                isActive ? 'bg-primary' : 'bg-transparent group-hover:bg-border'
              )}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
