/**
 * Application route definitions.
 *
 * Import from here whenever you need to link between pages.
 * Changing a route path here updates every link in the application.
 */

export const ROUTES = {
  // ── Public ───────────────────────────────────────────────────────────────
  LOGIN: '/login',

  // ── Dashboard ────────────────────────────────────────────────────────────
  DASHBOARD: '/dashboard',

  // ── Products ─────────────────────────────────────────────────────────────
  PRODUCTS: {
    LIST: '/products',
    NEW: '/products/new',
    DETAIL: (id: string) => `/products/${id}`,
    EDIT: (id: string) => `/products/${id}/edit`,
  },

  // ── Categories ───────────────────────────────────────────────────────────
  CATEGORIES: {
    LIST: '/categories',
    NEW: '/categories/new',
    DETAIL: (id: string) => `/categories/${id}`,
    EDIT: (id: string) => `/categories/${id}/edit`,
  },

  // ── Tables ───────────────────────────────────────────────────────────────
  TABLES: {
    LIST: '/tables',
    NEW: '/tables/new',
    DETAIL: (id: string) => `/tables/${id}`,
    EDIT: (id: string) => `/tables/${id}/edit`,
  },

  // ── Bookings ─────────────────────────────────────────────────────────────
  BOOKINGS: {
    LIST: '/bookings',
    NEW: '/bookings/new',
    DETAIL: (id: string) => `/bookings/${id}`,
    EDIT: (id: string) => `/bookings/${id}/edit`,
  },

  // ── Customers ────────────────────────────────────────────────────────────
  CUSTOMERS: {
    LIST: '/customers',
    NEW: '/customers/new',
    DETAIL: (id: string) => `/customers/${id}`,
    EDIT: (id: string) => `/customers/${id}/edit`,
  },

  // ── Staff ────────────────────────────────────────────────────────────────
  STAFF: {
    LIST: '/staff',
    NEW: '/staff/new',
    DETAIL: (id: string) => `/staff/${id}`,
    EDIT: (id: string) => `/staff/${id}/edit`,
  },

  // ── Roles ────────────────────────────────────────────────────────────────
  ROLES: {
    LIST: '/roles',
    NEW: '/roles/new',
    DETAIL: (id: string) => `/roles/${id}`,
    EDIT: (id: string) => `/roles/${id}/edit`,
  },

  // ── Departments ──────────────────────────────────────────────────────────
  DEPARTMENTS: {
    LIST: '/departments',
    NEW: '/departments/new',
    DETAIL: (id: string) => `/departments/${id}`,
    EDIT: (id: string) => `/departments/${id}/edit`,
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  SETTINGS: {
    ROOT: '/settings',
    PROFILE: '/settings/profile',
    ACCOUNT: '/settings/account',
    APPEARANCE: '/settings/appearance',
    AUDIT_LOG: '/settings/audit-log',
  },
} as const;
