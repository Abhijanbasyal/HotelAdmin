import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { Role } from '@/models/Role.model';
import { AuditLog } from '@/models/AuditLog.model';
import { softDeleteDocument, restoreDocument } from '@/utils/softDelete';
import { paginateQuery, parsePaginationOptions } from '@/utils/pagination';
import { AppError } from '@/utils/AppError';

describe('Soft Delete & Restoration Infrastructure', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await Role.deleteMany({ name: { $regex: /^SoftDeleteTest/ } });
    await AuditLog.deleteMany({ entityType: 'Role' });
    await disconnectDatabase();
  });

  it('marks a document as deleted and sets deletedAt timestamp', async () => {
    const role = await Role.create({
      name: 'SoftDeleteTest_Role_A',
      description: 'Test Role for Soft Deletion',
      permissions: ['tables.read'],
      isDeleted: false,
    });

    const deletedRole = await softDeleteDocument(Role, role._id);

    expect(deletedRole.isDeleted).toBe(true);
    expect(deletedRole.deletedAt).toBeInstanceOf(Date);

    // Verify it cannot be deleted again
    await expect(softDeleteDocument(Role, role._id)).rejects.toThrow(AppError);
  });

  it('excludes soft-deleted documents by default in paginateQuery', async () => {
    // 1. Role A is deleted, Role B is active
    const roleB = await Role.create({
      name: 'SoftDeleteTest_Role_B',
      description: 'Active Role',
      permissions: ['tables.read'],
      isDeleted: false,
    });

    const defaultOpts = parsePaginationOptions({ includeDeleted: false });
    const result = await paginateQuery(Role, { name: { $regex: /^SoftDeleteTest/ } }, defaultOpts);

    const names = result.data.map((r) => r.name);
    expect(names).toContain(roleB.name);
    expect(names).not.toContain('SoftDeleteTest_Role_A');

    // 2. Querying with includeDeleted: true includes deleted documents
    const withDeletedOpts = parsePaginationOptions({ includeDeleted: true });
    const resultWithDeleted = await paginateQuery(
      Role,
      { name: { $regex: /^SoftDeleteTest/ } },
      withDeletedOpts
    );

    const allNames = resultWithDeleted.data.map((r) => r.name);
    expect(allNames).toContain('SoftDeleteTest_Role_A');
    expect(allNames).toContain('SoftDeleteTest_Role_B');
  });

  it('prevents restoring when an active record has a conflicting unique field', async () => {
    // Role A was deleted with name 'SoftDeleteTest_Role_A'
    const deletedRole = await Role.findOne({ name: 'SoftDeleteTest_Role_A' });
    expect(deletedRole).toBeDefined();

    // Create a new ACTIVE role
    const conflictingRole = await Role.create({
      name: 'SoftDeleteTest_ActiveConflict',
      permissions: ['tables.read'],
      isDeleted: false,
    });

    // Attempting to restore with a check for the active conflicting name should detect collision
    await expect(
      restoreDocument(Role, deletedRole!._id, undefined, {
        uniqueChecks: [{ field: 'name', value: 'SoftDeleteTest_ActiveConflict' }],
      })
    ).rejects.toThrow(
      'Cannot restore: an active Role with name "SoftDeleteTest_ActiveConflict" already exists.'
    );

    // Also verify custom error message override works as expected
    await expect(
      restoreDocument(Role, deletedRole!._id, undefined, {
        uniqueChecks: [
          {
            field: 'name',
            value: 'SoftDeleteTest_ActiveConflict',
            message: 'Custom collision error: active role with this name exists.',
          },
        ],
      })
    ).rejects.toThrow('Custom collision error: active role with this name exists.');

    // Clean up conflicting role
    await Role.findByIdAndDelete(conflictingRole._id);
  });

  it('successfully restores a soft-deleted document when no conflict exists', async () => {
    const role = await Role.create({
      name: 'SoftDeleteTest_Role_RestoreMe',
      permissions: ['tables.read'],
      isDeleted: false,
    });

    await softDeleteDocument(Role, role._id);

    const restoredRole = await restoreDocument(Role, role._id, undefined, {
      uniqueChecks: [{ field: 'name' }],
    });

    expect(restoredRole.isDeleted).toBe(false);
    expect(restoredRole.deletedAt).toBeNull();
    expect(restoredRole.deletedBy).toBeNull();

    // Cannot restore an already active document
    await expect(restoreDocument(Role, role._id)).rejects.toThrow(
      'Role is not deleted.'
    );
  });
});
