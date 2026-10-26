'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Breadcrumbs,
  PageHeader,
  DataTable,
  Modal,
  ConfirmDialog,
  Button,
  Input,
  Textarea,
  Select,
  StatusBadge,
  FormField,
  FormActions,
  StatCard,
  Checkbox,
  type ColumnDef,
  type RowAction,
} from '@/components';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  restoreRole,
  getAvailablePermissions,
  type RoleItem,
  type PermissionDef,
} from '@/services/api/role.api';

const roleSchema = z.object({
  name: z
    .string({ required_error: 'Role name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  description: z.string().trim().max(200, 'Description cannot exceed 200 characters').optional(),
  permissions: z
    .array(z.string())
    .min(1, 'Please select at least one permission for this role'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const selectedPermissions = watch('permissions') || [];

  const fetchPermissions = useCallback(async () => {
    try {
      const perms = await getAvailablePermissions();
      setAvailablePermissions(perms);
    } catch {
      // Non-blocking
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const isSystemParam =
        systemFilter === 'system' ? true : systemFilter === 'custom' ? false : undefined;
      const res = await listRoles({
        page,
        limit,
        search: search.trim() || undefined,
        isSystem: isSystemParam,
      });
      setRoles(res.data);
      setTotal(res.meta?.pagination?.total ?? res.data.length);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, systemFilter]);

  useEffect(() => {
    void fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  // Group permissions by module
  const permissionsByModule = availablePermissions.reduce<Record<string, PermissionDef[]>>(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {}
  );

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    reset({
      name: '',
      description: '',
      permissions: ['dashboard.read'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: RoleItem) => {
    setEditingRole(role);
    reset({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setIsModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setValue(
        'permissions',
        selectedPermissions.filter((p) => p !== permId)
      );
    } else {
      setValue('permissions', [...selectedPermissions, permId]);
    }
  };

  const toggleModulePermissions = (module: string) => {
    const modulePerms = permissionsByModule[module] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all in module
      setValue(
        'permissions',
        selectedPermissions.filter((id) => !modulePermIds.includes(id))
      );
    } else {
      // Select all in module
      const unique = Array.from(new Set([...selectedPermissions, ...modulePermIds]));
      setValue('permissions', unique);
    }
  };

  const handleSelectAll = () => {
    const allIds = availablePermissions.map((p) => p.id);
    setValue('permissions', allIds);
  };

  const handleClearAll = () => {
    setValue('permissions', []);
  };

  const onSubmit = async (values: RoleFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingRole) {
        await updateRole(editingRole._id, values);
        toast.success(`Role "${values.name}" updated successfully`);
      } else {
        await createRole(values);
        toast.success(`Role "${values.name}" created successfully`);
      }
      setIsModalOpen(false);
      void fetchRoles();
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setIsSubmitting(true);
      await deleteRole(roleToDelete._id);
      toast.success(`Role "${roleToDelete.name}" deleted successfully`);
      setRoleToDelete(null);
      void fetchRoles();
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || err.message || 'Failed to delete role';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreRole = async (role: RoleItem) => {
    try {
      await restoreRole(role._id);
      toast.success(`Role "${role.name}" restored successfully`);
      void fetchRoles();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to restore role');
    }
  };

  // Metrics summary
  const systemCount = roles.filter((r) => r.isSystem).length;
  const customCount = roles.filter((r) => !r.isSystem).length;

  const columns: ColumnDef<RoleItem>[] = [
    {
      id: 'name',
      header: 'Role Name',
      cell: (role) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {role.isSystem ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div>
            <div className="font-semibold text-foreground flex items-center gap-2">
              <span>{role.name}</span>
              {role.isSystem && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20">
                  SYSTEM
                </span>
              )}
            </div>
            {role.description && (
              <div className="text-xs text-muted-foreground truncate max-w-sm">
                {role.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      cell: (role) => (
        <StatusBadge
          variant={role.isSystem ? 'primary' : 'neutral'}
          label={role.isSystem ? 'System Defined' : 'Custom Role'}
        />
      ),
    },
    {
      id: 'permissions',
      header: 'Permissions',
      cell: (role) => {
        if (role.permissions.includes('*')) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Check className="h-3 w-3" /> Full Root Access (*)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
            {role.permissions.length} capabilities
          </span>
        );
      },
    },
  ];

  const rowActions: RowAction<RoleItem>[] = [
    {
      label: 'Edit Role',
      icon: <Edit2 className="h-4 w-4 text-primary" />,
      onClick: handleOpenEditModal,
    },
    {
      label: 'Delete Role',
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      variant: 'danger',
      onClick: (role) => setRoleToDelete(role),
      hidden: (role) => role.isSystem || role.isDeleted,
    },
    {
      label: 'Restore Role',
      icon: <RotateCcw className="h-4 w-4 text-success" />,
      onClick: (role) => void handleRestoreRole(role),
      hidden: (role) => !role.isDeleted,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Configure role-based access control (RBAC) and assign granular permissions."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Roles & Permissions', href: '/roles' },
            ]}
          />
        }
        actions={
          <Button onClick={handleOpenCreateModal} size="md">
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Roles"
          value={total}
          icon={<Shield className="h-5 w-5 text-primary" />}
          description="Configured access profiles"
        />
        <StatCard
          title="System Roles"
          value={systemCount}
          icon={<ShieldCheck className="h-5 w-5 text-sky-500" />}
          description="Protected core system roles"
        />
        <StatCard
          title="Custom Roles"
          value={customCount}
          icon={<ShieldAlert className="h-5 w-5 text-purple-500" />}
          description="User-defined custom permission sets"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search role name or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={systemFilter}
            onChange={(e) => {
              setSystemFilter(e.target.value as 'all' | 'system' | 'custom');
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'system', label: 'System Roles' },
              { value: 'custom', label: 'Custom Roles' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable<RoleItem>
        data={roles}
        columns={columns}
        actions={rowActions}
        rowKey={(r) => r._id}
        isLoading={isLoading}
        emptyTitle="No roles found"
        emptyDescription="Create custom roles to customize permission access for hotel staff."
        pagination={{
          page,
          pageSize: limit,
          total,
        }}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />

      {/* Create / Edit Modal with Permission Matrix */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role'}
        description="Specify role name, description, and assign modular permissions."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <FormField id="role-name" label="Role Name" error={errors.name?.message} required>
              <Input
                id="role-name"
                {...register('name')}
                placeholder="e.g. Concierge Supervisor"
                disabled={isSubmitting || Boolean(editingRole?.isSystem)}
              />
            </FormField>

            <FormField id="role-desc" label="Description" error={errors.description?.message}>
              <Textarea
                id="role-desc"
                {...register('description')}
                placeholder="Describe responsibilities and privileges granted by this role..."
                rows={2}
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          {/* Permission Matrix */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Modular Permissions</h4>
                <p className="text-xs text-muted-foreground">
                  Select the capabilities granted to users assigned this role.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-7 text-muted-foreground"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {errors.permissions && (
              <p className="text-xs text-destructive">{errors.permissions.message}</p>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(permissionsByModule).map(([module, perms]) => {
                const modulePermIds = perms.map((p) => p.id);
                const allSelected = modulePermIds.every((id) =>
                  selectedPermissions.includes(id)
                );

                return (
                  <div key={module} className="rounded-lg border border-border p-3.5 bg-muted/20">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs uppercase tracking-wider text-primary">
                          {module}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          ({perms.filter((p) => selectedPermissions.includes(p.id)).length}/
                          {perms.length})
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleModulePermissions(module)}
                        className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
                      >
                        {allSelected ? 'Deselect Module' : 'Select Module'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'border-primary/40 bg-primary/5 text-foreground'
                                : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onChange={() => togglePermission(perm.id)}
                            />
                            <span>{perm.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingRole ? 'Save Role Changes' : 'Create Custom Role'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={() => void handleDeleteRole()}
        title="Delete Custom Role"
        message={`Are you sure you want to delete role "${roleToDelete?.name}"? Any staff members currently holding this role must be reassigned first.`}
        confirmLabel="Delete Role"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
