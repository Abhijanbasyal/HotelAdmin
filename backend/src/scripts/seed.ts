import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Role } from '@/models/Role.model';
import { User } from '@/models/User.model';
import { logger } from '@/utils/logger';

const DEFAULT_ROLES = [
  {
    name: 'Super Admin',
    description: 'Full root access to all system modules and settings',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: 'Hotel Manager',
    description: 'Manages hotel daily operations, staff, tables, and bookings',
    permissions: [
      'dashboard.read',
      'products.read',
      'products.create',
      'products.update',
      'categories.read',
      'categories.create',
      'categories.update',
      'tables.read',
      'tables.create',
      'tables.update',
      'bookings.read',
      'bookings.create',
      'bookings.update',
      'customers.read',
      'customers.create',
      'customers.update',
      'staff.read',
      'departments.read',
      'settings.read',
      'audit.read',
    ],
    isSystem: true,
  },
  {
    name: 'Receptionist',
    description: 'Handles table reservations, guests, and customer check-ins',
    permissions: [
      'dashboard.read',
      'tables.read',
      'bookings.read',
      'bookings.create',
      'bookings.update',
      'customers.read',
      'customers.create',
      'customers.update',
    ],
    isSystem: true,
  },
  {
    name: 'Staff',
    description: 'General staff access to view tables and bookings',
    permissions: [
      'tables.read',
      'bookings.read',
      'products.read',
    ],
    isSystem: true,
  },
];

async function seed(): Promise<void> {
  try {
    logger.info('Connecting to database for seeding...');
    await connectDatabase();

    // 1. Seed Roles
    for (const roleDef of DEFAULT_ROLES) {
      const existing = await Role.findOne({ name: roleDef.name });
      if (!existing) {
        await Role.create(roleDef);
        logger.info({ role: roleDef.name }, 'Created role');
      } else {
        existing.permissions = roleDef.permissions;
        existing.description = roleDef.description;
        await existing.save();
        logger.info({ role: roleDef.name }, 'Updated role');
      }
    }

    // 2. Seed Super Admin User
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      throw new Error('Super Admin role not found after seeding roles');
    }

    const adminEmail = 'admin@hoteladmin.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: 'Admin@123456',
        role: superAdminRole._id,
        isActive: true,
        isDeleted: false,
      });
      logger.info({ email: adminEmail }, 'Created Super Admin user (Password: Admin@123456)');
    } else {
      existingAdmin.role = superAdminRole._id;
      existingAdmin.isActive = true;
      existingAdmin.isDeleted = false;
      await existingAdmin.save();
      logger.info({ email: adminEmail }, 'Super Admin user already exists, refreshed role');
    }

    logger.info('Seeding completed successfully!');
  } catch (err) {
    logger.error({ err }, 'Seeding failed');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void seed();
