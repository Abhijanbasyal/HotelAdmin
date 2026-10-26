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
  User,
  Shield,
  Building,
  Phone,
  Mail,
  Briefcase,
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
  Select,
  ActiveBadge,
  FormField,
  FormActions,
  FormGrid,
  ImageUploader,
  type ColumnDef,
  type RowAction,
} from '@/components';
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  restoreStaff,
  getActiveRoles,
  type StaffItem,
  type RoleItem,
} from '@/services/api/staff.api';
import { getActiveDepartments } from '@/services/api/department.api';
import { getAssetUrl } from '@/services/api/asset.api';
import { formatDate } from '@/utils/format';
import { ROUTES } from '@/config/routes';

const staffSchema = z.object({
  name: z
    .string({ required_error: 'Staff name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .optional()
    .or(z.literal('')),
  role: z.string().min(1, 'Please select a system role'),
  department: z.string().optional().or(z.literal('')),
  jobTitle: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      department: '',
      jobTitle: '',
      phone: '',
      avatarUrl: '',
      isActive: true,
    },
  });

  const selectedAvatar = watch('avatarUrl');

  // Load roles and departments
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [rolesData, deptsData] = await Promise.all([
          getActiveRoles(),
          getActiveDepartments(),
        ]);
        setRoles(rolesData);
        setDepartments(deptsData);
      } catch {
        // silent fallback
      }
    }
    void loadMetadata();
  }, []);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const isActiveBool =
        activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;

      const res = await listStaff({
        page,
        limit,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        department: departmentFilter || undefined,
        isActive: isActiveBool,
      });
      setStaffList(res.data);
      setTotal(res.meta.pagination.total);
    } catch {
      toast.error('Failed to load staff list');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, roleFilter, departmentFilter, activeFilter]);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    reset({
      name: '',
      email: '',
      password: '',
      role: roles.length > 0 ? roles[0]._id : '',
      department: '',
      jobTitle: '',
      phone: '',
      avatarUrl: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffItem) => {
    setEditingStaff(staff);
    const roleId =
      typeof staff.role === 'object' && staff.role !== null
        ? staff.role._id || staff.role.id
        : staff.role;

    const deptId =
      typeof staff.department === 'object' && staff.department !== null
        ? staff.department._id || staff.department.id
        : staff.department || '';

    reset({
      name: staff.name,
      email: staff.email,
      password: '',
      role: roleId,
      department: deptId,
      jobTitle: staff.jobTitle || '',
      phone: staff.phone || '',
      avatarUrl: staff.avatarUrl || '',
      isActive: staff.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: StaffFormValues) => {
    if (!editingStaff && (!values.password || values.password.length < 8)) {
      toast.error('Password of at least 8 characters is required for new accounts');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id || editingStaff._id, {
          name: values.name,
          email: values.email,
          role: values.role,
          department: values.department || undefined,
          jobTitle: values.jobTitle,
          phone: values.phone,
          avatarUrl: values.avatarUrl,
          isActive: values.isActive,
          password: values.password || undefined,
        });
        toast.success(`Staff member "${values.name}" updated successfully`);
      } else {
        await createStaff({
          name: values.name,
          email: values.email,
          password: values.password!,
          role: values.role,
          department: values.department || undefined,
          jobTitle: values.jobTitle,
          phone: values.phone,
          avatarUrl: values.avatarUrl,
          isActive: values.isActive,
        });
        toast.success(`Staff member "${values.name}" created successfully`);
      }
      setIsModalOpen(false);
      void fetchStaff();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaff(staffToDelete.id || staffToDelete._id);
      toast.success(`Staff member "${staffToDelete.name}" soft-deleted`);
      setStaffToDelete(null);
      void fetchStaff();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to delete staff member';
      toast.error(msg);
    }
  };

  const handleRestore = async (staff: StaffItem) => {
    try {
      await restoreStaff(staff.id || staff._id);
      toast.success(`Staff member "${staff.name}" restored successfully`);
      void fetchStaff();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to restore staff member';
      toast.error(msg);
    }
  };

  const columns: ColumnDef<StaffItem>[] = [
    {
      id: 'avatar',
      header: 'Avatar',
      cell: (row) => (
        <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {row.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAssetUrl(row.avatarUrl)}
              alt={row.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <User className="h-5 w-5 text-slate-400" />
          )}
        </div>
      ),
    },
    {
      id: 'name',
      header: 'Staff & Email',
      sortKey: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Mail className="h-3 w-3 text-slate-400" />
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => {
        const roleName =
          typeof row.role === 'object' && row.role !== null ? row.role.name : 'Staff';
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
            <Shield className="h-3 w-3" />
            {roleName}
          </span>
        );
      },
    },
    {
      id: 'department',
      header: 'Department',
      cell: (row) => {
        const deptName =
          typeof row.department === 'object' && row.department !== null
            ? row.department.name
            : '—';
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
            <Building className="h-3.5 w-3.5 text-slate-400" />
            <span>{deptName}</span>
          </div>
        );
      },
    },
    {
      id: 'jobTitle',
      header: 'Job Title & Phone',
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
            <Briefcase className="h-3 w-3 text-slate-400" />
            <span>{row.jobTitle || 'Staff Member'}</span>
          </div>
          {row.phone && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Phone className="h-3 w-3" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'isActive',
      header: 'Status',
      sortKey: 'isActive',
      cell: (row) => <ActiveBadge isActive={row.isActive} activeLabel="Active" inactiveLabel="Disabled" />,
    },
    {
      id: 'createdAt',
      header: 'Joined',
      sortKey: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const actions: RowAction<StaffItem>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row) => handleOpenEditModal(row),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      hidden: (row) => row.isDeleted,
      onClick: (row) => setStaffToDelete(row),
    },
    {
      label: 'Restore',
      icon: <RotateCcw className="h-4 w-4 text-emerald-600" />,
      hidden: (row) => !row.isDeleted,
      onClick: (row) => void handleRestore(row),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Members"
        description="Manage employee user accounts, system roles, department associations, and access status."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: ROUTES.DASHBOARD },
              { label: 'Staff' },
            ]}
          />
        }
        actions={
          <Button size="sm" onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone, or title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </Select>

          {/* Department Filter */}
          <Select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="w-32"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </Select>
        </div>
      </div>

      {/* Shared DataTable */}
      <DataTable
        data={staffList}
        columns={columns}
        actions={actions}
        rowKey={(row) => row.id || row._id}
        isLoading={isLoading}
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
        emptyTitle="No staff members found"
        emptyDescription="Click 'Add Staff' to invite team members."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        description="Configure staff credentials, assign department and security permissions."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Avatar Photo */}
          <ImageUploader
            label="Staff Profile Photo"
            entityType="Staff"
            value={selectedAvatar}
            onChange={(val) => setValue('avatarUrl', typeof val === 'string' ? val : val[0] || '')}
            disabled={isSubmitting}
          />

          <FormGrid cols={2}>
            <FormField id="staff-name" label="Full Name" required error={errors.name?.message}>
              <Input
                id="staff-name"
                {...register('name')}
                placeholder="e.g. Alice Smith"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="staff-email" label="Email Address" required error={errors.email?.message}>
              <Input
                id="staff-email"
                type="email"
                {...register('email')}
                placeholder="e.g. alice@hoteladmin.com"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField
              id="staff-password"
              label={editingStaff ? 'New Password (leave blank to keep current)' : 'Account Password'}
              required={!editingStaff}
              error={errors.password?.message}
            >
              <Input
                id="staff-password"
                type="password"
                {...register('password')}
                placeholder={editingStaff ? '••••••••' : 'Minimum 8 characters'}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="staff-role" label="Role & Permissions" required error={errors.role?.message}>
              <Select id="staff-role" {...register('role')} disabled={isSubmitting}>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField id="staff-department" label="Department" error={errors.department?.message}>
              <Select id="staff-department" {...register('department')} disabled={isSubmitting}>
                <option value="">No Department Assigned</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="staff-jobTitle" label="Job Title" error={errors.jobTitle?.message}>
              <Input
                id="staff-jobTitle"
                {...register('jobTitle')}
                placeholder="e.g. Receptionist, Head Concierge"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField id="staff-phone" label="Contact Phone" error={errors.phone?.message}>
              <Input
                id="staff-phone"
                {...register('phone')}
                placeholder="e.g. +1-555-0222"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="staff-status" label="Account State">
              <Select
                id="staff-status"
                value={watch('isActive') ? 'true' : 'false'}
                onChange={(e) => setValue('isActive', e.target.value === 'true')}
                disabled={isSubmitting}
              >
                <option value="true">Active (Can log in)</option>
                <option value="false">Disabled (Suspended)</option>
              </Select>
            </FormField>
          </FormGrid>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingStaff ? 'Save Changes' : 'Create Staff Account'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete Staff Member"
        message={`Are you sure you want to delete staff account "${staffToDelete?.name}"? Historical audit logs and operations performed by this staff member will be preserved.`}
        confirmLabel="Soft Delete Staff"
        variant="danger"
      />
    </div>
  );
}
