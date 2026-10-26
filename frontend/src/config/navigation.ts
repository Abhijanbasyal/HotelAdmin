import {
  LayoutDashboard,
  Package,
  Tag,
  SquareStack,
  CalendarCheck,
  Users,
  UserCog,
  Shield,
  Building2,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from './routes';

export interface NavSubItem {
  label: string;
  href: string;
  /** Permission required to see this item (optional) */
  permission?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  /** Children trigger collapsible submenu */
  children?: NavSubItem[];
  /** Permission required to see this section */
  permission?: string;
  /** Items without children use this as the active route prefix */
  activePrefix?: string;
}

/**
 * Centralized sidebar navigation configuration.
 *
 * - Adding or renaming a nav item here updates the sidebar automatically.
 * - Permission strings are checked by the sidebar renderer.
 * - Icons are Lucide React icons.
 */
export const NAVIGATION: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    activePrefix: '/dashboard',
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    permission: 'products.read',
    children: [
      { label: 'All Products', href: ROUTES.PRODUCTS.LIST, permission: 'products.read' },
      { label: 'Add Product', href: ROUTES.PRODUCTS.NEW, permission: 'products.create' },
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Tag,
    permission: 'categories.read',
    children: [
      { label: 'All Categories', href: ROUTES.CATEGORIES.LIST, permission: 'categories.read' },
      { label: 'Add Category', href: ROUTES.CATEGORIES.NEW, permission: 'categories.create' },
    ],
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: SquareStack,
    permission: 'tables.read',
    children: [
      { label: 'All Tables', href: ROUTES.TABLES.LIST, permission: 'tables.read' },
      { label: 'Add Table', href: ROUTES.TABLES.NEW, permission: 'tables.create' },
    ],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: CalendarCheck,
    permission: 'bookings.read',
    children: [
      { label: 'All Bookings', href: ROUTES.BOOKINGS.LIST, permission: 'bookings.read' },
      { label: 'New Booking', href: ROUTES.BOOKINGS.NEW, permission: 'bookings.create' },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    permission: 'customers.read',
    children: [
      { label: 'All Customers', href: ROUTES.CUSTOMERS.LIST, permission: 'customers.read' },
      { label: 'Add Customer', href: ROUTES.CUSTOMERS.NEW, permission: 'customers.create' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff',
    icon: UserCog,
    permission: 'staff.read',
    children: [
      { label: 'All Staff', href: ROUTES.STAFF.LIST, permission: 'staff.read' },
      { label: 'Add Staff', href: ROUTES.STAFF.NEW, permission: 'staff.create' },
    ],
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: Shield,
    permission: 'roles.manage',
    children: [
      { label: 'All Roles', href: ROUTES.ROLES.LIST, permission: 'roles.manage' },
      { label: 'Create Role', href: ROUTES.ROLES.NEW, permission: 'roles.manage' },
    ],
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: Building2,
    permission: 'departments.read',
    children: [
      {
        label: 'All Departments',
        href: ROUTES.DEPARTMENTS.LIST,
        permission: 'departments.read',
      },
      {
        label: 'Add Department',
        href: ROUTES.DEPARTMENTS.NEW,
        permission: 'departments.create',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Profile', href: ROUTES.SETTINGS.PROFILE },
      { label: 'Appearance', href: ROUTES.SETTINGS.APPEARANCE },
      { label: 'Account', href: ROUTES.SETTINGS.ACCOUNT },
      { label: 'Audit Log', href: ROUTES.SETTINGS.AUDIT_LOG, permission: 'settings.manage' },
    ],
  },
];
