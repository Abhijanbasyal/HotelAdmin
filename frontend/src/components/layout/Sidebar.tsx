'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Hotel, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAVIGATION, type NavItem } from '@/config/navigation';
import { IconButton } from '@/components/ui/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  /** Mobile: controlled by Topbar hamburger */
  isOpen: boolean;
  onClose: () => void;
  /** Desktop: collapsed to icon-only rail */
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  /** User permissions for menu visibility filtering */
  userPermissions?: string[];
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  userPermissions = [],
}: SidebarProps) {
  const pathname = usePathname();

  // Close mobile sidebar when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full flex flex-col',
          'bg-sidebar border-r border-sidebar-border',
          'transition-all duration-300 ease-in-out',
          // Desktop: animate width between full and collapsed
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-[var(--sidebar-width-collapsed)]' : 'lg:w-[var(--sidebar-width)]',
          // Mobile: slide in/out
          isOpen ? 'translate-x-0 w-[var(--sidebar-width)]' : '-translate-x-full w-[var(--sidebar-width)]'
        )}
        aria-label="Main navigation"
      >
        {/* ── Logo / Brand ─────────────────────────────────────────────────── */}
        <div className={cn(
          'flex h-[var(--topbar-height)] items-center border-b border-sidebar-border shrink-0',
          isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
        )}>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2.5 group',
              isCollapsed && 'lg:hidden'
            )}
            aria-label="Hotel Management — Go to Dashboard"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Hotel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">
                Hotel Admin
              </p>
              <p className="text-xs text-sidebar-foreground/60 leading-tight truncate">
                Management System
              </p>
            </div>
          </Link>

          {/* Collapsed icon-only logo */}
          {isCollapsed && (
            <Link href="/dashboard" className="hidden lg:flex items-center justify-center" aria-label="Dashboard">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Hotel className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
          )}

          {/* Mobile close button */}
          <IconButton
            icon={<X className="h-4 w-4" />}
            aria-label="Close navigation"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          />
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2" aria-label="Sidebar navigation">
          <ul className="space-y-0.5" role="list">
            {NAVIGATION.filter((item) => canSeeNavItem(item, userPermissions)).map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                userPermissions={userPermissions}
              />
            ))}
          </ul>
        </nav>

        {/* ── Collapse toggle (desktop only) ───────────────────────────────── */}
        <div className="hidden lg:flex shrink-0 items-center border-t border-sidebar-border px-2 py-2">
          <IconButton
            icon={
              isCollapsed
                ? <PanelLeft className="h-4 w-4" />
                : <PanelLeftClose className="h-4 w-4" />
            }
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className={cn(
              'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
              isCollapsed ? 'mx-auto' : 'ml-auto'
            )}
          />
        </div>
      </aside>
    </>
  );
}

// ── Nav Item ───────────────────────────────────────────────────────────────────

interface NavItemComponentProps {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
  userPermissions: string[];
}

function NavItemComponent({
  item,
  pathname,
  isCollapsed,
  userPermissions,
}: NavItemComponentProps) {
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(item.href + '/')
    : isParentActive(item, pathname);

  const [isExpanded, setIsExpanded] = useState(isActive);

  // Auto-expand parent when a child is active
  useEffect(() => {
    if (isActive && item.children) {
      setIsExpanded(true);
    }
  }, [isActive, item.children]);

  const Icon = item.icon;

  // ── Simple item (no children) ──────────────────────────────────────────────
  if (!item.children) {
    return (
      <li>
        <Link
          href={item.href ?? '#'}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2',
            'text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            isCollapsed && 'lg:justify-center lg:px-2'
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
          {isCollapsed && (
            <span className="sr-only">{item.label}</span>
          )}
        </Link>
      </li>
    );
  }

  // ── Collapsible item (has children) ───────────────────────────────────────
  const filteredChildren = item.children.filter(
    (child) => !child.permission || userPermissions.includes(child.permission)
  );

  if (filteredChildren.length === 0) return null;

  return (
    <li>
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2',
          'text-sm font-medium transition-colors duration-150',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isCollapsed && 'lg:justify-center lg:px-2'
        )}
        aria-expanded={isExpanded}
        aria-label={item.label}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
              aria-hidden
            />
          </>
        )}
        {isCollapsed && <span className="sr-only">{item.label}</span>}
      </button>

      {/* Submenu */}
      {!isCollapsed && isExpanded && (
        <ul className="mt-0.5 ml-3 pl-3 border-l border-sidebar-border space-y-0.5" role="list">
          {filteredChildren.map((child) => {
            const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5',
                    'text-sm transition-colors duration-150',
                    childActive
                      ? 'text-primary font-medium bg-primary/10'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                  aria-current={childActive ? 'page' : undefined}
                >
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isParentActive(item: NavItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + '/')
  );
}

function canSeeNavItem(item: NavItem, permissions: string[]): boolean {
  if (!item.permission) return true;
  return permissions.includes(item.permission);
}
