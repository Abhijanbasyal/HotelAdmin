'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { Footer } from '@/components/layout/Footer';

import { useAuth } from '@/hooks/useAuth';

const SIDEBAR_COLLAPSED_KEY = 'hms-sidebar-collapsed';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Main admin layout — wraps all dashboard pages.
 * Manages sidebar open/collapsed state and passes authenticated user data to Topbar and Sidebar.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  // Restore collapsed preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const handleMobileOpen = useCallback(() => setIsMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setIsMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Sidebar
        isOpen={isMobileOpen}
        onClose={handleMobileClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        userPermissions={user?.permissions ?? []}
      />

      {/* ── Topbar ───────────────────────────────────────────────────────── */}
      <Topbar
        onMobileMenuOpen={handleMobileOpen}
        isSidebarCollapsed={isCollapsed}
        user={user}
        onLogout={logout}
      />

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main
        className={cn(
          'pt-[var(--topbar-height)] pb-10 min-h-screen',
          'transition-[margin-left] duration-300',
          // Offset for sidebar on desktop
          isCollapsed
            ? 'lg:ml-[var(--sidebar-width-collapsed)]'
            : 'lg:ml-[var(--sidebar-width)]'
        )}
      >
        <div className="page-container">{children}</div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <Footer isSidebarCollapsed={isCollapsed} />
    </div>
  );
}
