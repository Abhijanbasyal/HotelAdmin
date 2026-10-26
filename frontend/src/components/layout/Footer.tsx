'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export interface FooterProps {
  isSidebarCollapsed: boolean;
}

export function Footer({ isSidebarCollapsed }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'fixed bottom-0 right-0 z-10 h-10',
        'flex items-center justify-between gap-4 px-6',
        'bg-card/80 backdrop-blur-sm border-t border-border/60',
        'text-xs text-muted-foreground',
        'transition-[left] duration-300',
        isSidebarCollapsed
          ? 'left-[var(--sidebar-width-collapsed)]'
          : 'left-0 lg:left-[var(--sidebar-width)]'
      )}
    >
      <span>Hotel Management System © {year}</span>
      <span className="hidden sm:block">v1.0.0</span>
    </footer>
  );
}
