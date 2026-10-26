import { z } from 'zod';
import { paginationQuerySchema } from './common.validator';

export const AVAILABLE_PERMISSIONS = [
  // Products
  { id: 'products.read', label: 'View Products', module: 'Products' },
  { id: 'products.create', label: 'Create Products', module: 'Products' },
  { id: 'products.update', label: 'Edit Products', module: 'Products' },
  { id: 'products.delete', label: 'Delete Products', module: 'Products' },

  // Categories
  { id: 'categories.read', label: 'View Categories', module: 'Categories' },
  { id: 'categories.create', label: 'Create Categories', module: 'Categories' },
  { id: 'categories.update', label: 'Edit Categories', module: 'Categories' },
  { id: 'categories.delete', label: 'Delete Categories', module: 'Categories' },

  // Tables
  { id: 'tables.read', label: 'View Tables', module: 'Tables' },
  { id: 'tables.create', label: 'Create Tables', module: 'Tables' },
  { id: 'tables.update', label: 'Edit Tables', module: 'Tables' },
  { id: 'tables.delete', label: 'Delete Tables', module: 'Tables' },

  // Bookings
  { id: 'bookings.read', label: 'View Bookings', module: 'Bookings' },
  { id: 'bookings.create', label: 'Create Bookings', module: 'Bookings' },
  { id: 'bookings.update', label: 'Edit Bookings', module: 'Bookings' },
  { id: 'bookings.delete', label: 'Delete Bookings', module: 'Bookings' },

  // Customers
  { id: 'customers.read', label: 'View Customers', module: 'Customers' },
  { id: 'customers.create', label: 'Create Customers', module: 'Customers' },
  { id: 'customers.update', label: 'Edit Customers', module: 'Customers' },
  { id: 'customers.delete', label: 'Delete Customers', module: 'Customers' },

  // Staff
  { id: 'staff.read', label: 'View Staff', module: 'Staff' },
  { id: 'staff.create', label: 'Create Staff', module: 'Staff' },
  { id: 'staff.update', label: 'Edit Staff', module: 'Staff' },
  { id: 'staff.delete', label: 'Delete Staff', module: 'Staff' },

  // Departments
  { id: 'departments.read', label: 'View Departments', module: 'Departments' },
  { id: 'departments.create', label: 'Create Departments', module: 'Departments' },
  { id: 'departments.update', label: 'Edit Departments', module: 'Departments' },
  { id: 'departments.delete', label: 'Delete Departments', module: 'Departments' },

  // Roles
  { id: 'roles.read', label: 'View Roles', module: 'Roles' },
  { id: 'roles.create', label: 'Create Roles', module: 'Roles' },
  { id: 'roles.update', label: 'Edit Roles', module: 'Roles' },
  { id: 'roles.delete', label: 'Delete Roles', module: 'Roles' },

  // Settings
  { id: 'settings.read', label: 'View Settings', module: 'Settings' },
  { id: 'settings.update', label: 'Update Settings', module: 'Settings' },

  // Audit Logs
  { id: 'audit.read', label: 'View Audit Logs', module: 'Audit' },

  // Dashboard
  { id: 'dashboard.read', label: 'View Dashboard', module: 'Dashboard' },
];

export const createRoleSchema = z.object({
  name: z
    .string({ required_error: 'Role name is required' })
    .trim()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name cannot exceed 50 characters'),
  description: z.string().trim().max(200, 'Description cannot exceed 200 characters').optional(),
  permissions: z
    .array(z.string())
    .min(1, 'Role must have at least one permission assigned'),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name cannot exceed 50 characters')
    .optional(),
  description: z.string().trim().max(200, 'Description cannot exceed 200 characters').optional(),
  permissions: z.array(z.string()).optional(),
});

export const roleQuerySchema = paginationQuerySchema.extend({
  isSystem: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleQueryParams = z.infer<typeof roleQuerySchema>;
