/**
 * Permission constants for the frontend.
 *
 * These must mirror the backend permission names exactly.
 * Use these constants in permission checks — never use inline strings.
 */

export const PERMISSIONS = {
  // Products
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  // Categories
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_CREATE: 'categories.create',
  CATEGORIES_UPDATE: 'categories.update',
  CATEGORIES_DELETE: 'categories.delete',

  // Tables
  TABLES_READ: 'tables.read',
  TABLES_CREATE: 'tables.create',
  TABLES_UPDATE: 'tables.update',
  TABLES_DELETE: 'tables.delete',

  // Bookings
  BOOKINGS_READ: 'bookings.read',
  BOOKINGS_CREATE: 'bookings.create',
  BOOKINGS_UPDATE: 'bookings.update',
  BOOKINGS_DELETE: 'bookings.delete',

  // Customers
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',

  // Staff
  STAFF_READ: 'staff.read',
  STAFF_CREATE: 'staff.create',
  STAFF_UPDATE: 'staff.update',
  STAFF_DELETE: 'staff.delete',

  // Roles
  ROLES_MANAGE: 'roles.manage',

  // Departments
  DEPARTMENTS_READ: 'departments.read',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_UPDATE: 'departments.update',
  DEPARTMENTS_DELETE: 'departments.delete',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',

  // Assets
  ASSETS_UPLOAD: 'assets.upload',
  ASSETS_DELETE: 'assets.delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
