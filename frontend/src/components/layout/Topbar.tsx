'use client';

import React from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { getInitials } from '@/utils/format';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TopbarUser {
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface TopbarProps {
  onMobileMenuOpen: () => void;
  isSidebarCollapsed: boolean;
  user?: TopbarUser | null;
  onLogout?: () => void;
}

// ── Topbar ────────────────────────────────────────────────────────────────────

export function Topbar({
  onMobileMenuOpen,
  isSidebarCollapsed,
  user,
  onLogout,
}: TopbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-[var(--topbar-height)]',
        'flex items-center justify-between gap-4 px-4 sm:px-6',
        'bg-card/95 backdrop-blur-sm border-b border-border',
        'transition-[left] duration-300',
        // Offset matches the sidebar width
        isSidebarCollapsed
          ? 'left-[var(--sidebar-width-collapsed)]'
          : 'left-0 lg:left-[var(--sidebar-width)]'
      )}
    >
      {/* ── Left: Hamburger + Breadcrumb placeholder ─────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <IconButton
          icon={<Menu className="h-5 w-5" />}
          aria-label="Open navigation menu"
          variant="ghost"
          size="icon-sm"
          onClick={onMobileMenuOpen}
          className="lg:hidden"
        />
        {/* Desktop: empty left space — breadcrumbs are rendered in page content */}
      </div>

      {/* ── Right: Actions ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <ThemeToggle theme={theme} setTheme={setTheme} />

        {/* Notifications (placeholder — Phase 9) */}
        <IconButton
          icon={<Bell className="h-4.5 w-4.5" />}
          aria-label="Notifications"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground relative"
        >
          {/* Unread dot */}
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
        </IconButton>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5',
                'text-sm font-medium text-foreground',
                'hover:bg-muted transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <UserAvatar user={user} size="sm" />
              <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                  isUserMenuOpen && 'rotate-180'
                )}
                aria-hidden
              />
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <UserMenu
                user={user}
                onClose={() => setIsUserMenuOpen(false)}
                onLogout={onLogout}
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// ── Theme Toggle ───────────────────────────────────────────────────────────────

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: string | undefined;
  setTheme: (t: string) => void;
}) {
  const nextTheme =
    theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';

  const icons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const label = {
    light: 'Switch to dark mode',
    dark: 'Switch to system mode',
    system: 'Switch to light mode',
  };

  return (
    <IconButton
      icon={icons[theme as keyof typeof icons] ?? icons.system}
      aria-label={label[theme as keyof typeof label] ?? 'Toggle theme'}
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(nextTheme)}
      className="text-muted-foreground hover:text-foreground"
    />
  );
}

// ── User Avatar ───────────────────────────────────────────────────────────────

interface UserAvatarProps {
  user: TopbarUser;
  size?: 'sm' | 'md' | 'lg';
}

function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const sizeClass = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  }[size];

  if (user.avatarUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={cn('rounded-full object-cover border border-border', sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full',
        'bg-primary text-primary-foreground font-semibold shrink-0',
        sizeClass
      )}
      aria-hidden
    >
      {getInitials(user.name)}
    </div>
  );
}

// ── User Menu Dropdown ─────────────────────────────────────────────────────────

interface UserMenuProps {
  user: TopbarUser;
  onClose: () => void;
  onLogout?: () => void;
}

function UserMenu({ user, onClose, onLogout }: UserMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'absolute right-0 top-full mt-2 z-20',
          'w-64 rounded-lg border border-border bg-card shadow-dropdown',
          'animate-fade-in'
        )}
        role="menu"
        aria-label="User account menu"
      >
        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {user.role && (
              <p className="text-xs text-primary mt-0.5">{user.role}</p>
            )}
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1">
          <MenuLink
            href={ROUTES.SETTINGS.PROFILE}
            icon={<User className="h-4 w-4" />}
            label="My Profile"
            onClick={onClose}
          />
          <MenuLink
            href={ROUTES.SETTINGS.ROOT}
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            onClick={onClose}
          />
        </div>

        <div className="border-t border-border py-1">
          <button
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-muted transition-colors"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

interface MenuLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function MenuLink({ href, icon, label, onClick }: MenuLinkProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <span className="text-muted-foreground" aria-hidden>{icon}</span>
      {label}
    </Link>
  );
}
