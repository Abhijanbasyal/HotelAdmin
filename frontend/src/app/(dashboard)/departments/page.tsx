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
  Building2,
  CheckCircle2,
  XCircle,
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
  ActiveBadge,
  FormField,
  FormActions,
  FormGrid,
  StatCard,
  type ColumnDef,
  type RowAction,
} from '@/components';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  restoreDepartment,
  type DepartmentItem,
  type DepartmentStatus,
} from '@/services/api/department.api';
import { formatDate } from '@/utils/format';

const departmentSchema = z.object({
  name: z
    .string({ required_error: 'Department name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  code: z
    .string({ required_error: 'Department code is required' })
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code cannot exceed 10 characters'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DepartmentStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<DepartmentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'active',
    },
  });

  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listDepartments({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setDepartments(res.data);
      setTotal(res.meta?.pagination?.total ?? res.data.length);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    void fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    reset({
      name: '',
      code: '',
      description: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    reset({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      status: dept.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingDept) {
        await updateDepartment(editingDept._id, values);
        toast.success(`Department "${values.name}" updated successfully`);
      } else {
        await createDepartment(values);
        toast.success(`Department "${values.name}" created successfully`);
      }
      setIsModalOpen(false);
      void fetchDepartments();
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deptToDelete) return;
    try {
      setIsSubmitting(true);
      await deleteDepartment(deptToDelete._id);
      toast.success(`Department "${deptToDelete.name}" deleted successfully`);
      setDeptToDelete(null);
      void fetchDepartments();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to delete department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreDept = async (dept: DepartmentItem) => {
    try {
      await restoreDepartment(dept._id);
      toast.success(`Department "${dept.name}" restored successfully`);
      void fetchDepartments();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to restore department');
    }
  };

  // Metrics summary
  const activeCount = departments.filter((d) => d.status === 'active').length;
  const inactiveCount = departments.filter((d) => d.status === 'inactive').length;

  const columns: ColumnDef<DepartmentItem>[] = [
    {
      id: 'code',
      header: 'Code',
      cell: (dept) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-primary/10 text-primary">
          {dept.code}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Department Name',
      cell: (dept) => (
        <div>
          <div className="font-semibold text-foreground">{dept.name}</div>
          {dept.description && (
            <div className="text-xs text-muted-foreground truncate max-w-sm">
              {dept.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (dept) => <ActiveBadge isActive={dept.status === 'active'} />,
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (dept) => (
        <span className="text-xs text-muted-foreground">{formatDate(dept.createdAt)}</span>
      ),
    },
  ];

  const rowActions: RowAction<DepartmentItem>[] = [
    {
      label: 'Edit Department',
      icon: <Edit2 className="h-4 w-4 text-primary" />,
      onClick: handleOpenEditModal,
    },
    {
      label: 'Delete Department',
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      variant: 'danger',
      onClick: (dept) => setDeptToDelete(dept),
      hidden: (dept) => dept.isDeleted,
    },
    {
      label: 'Restore Department',
      icon: <RotateCcw className="h-4 w-4 text-success" />,
      onClick: (dept) => void handleRestoreDept(dept),
      hidden: (dept) => !dept.isDeleted,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Departments"
        description="Organize hotel operations, staff divisions, and operational structure."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Departments', href: '/departments' },
            ]}
          />
        }
        actions={
          <Button onClick={handleOpenCreateModal} size="md">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Departments"
          value={total}
          icon={<Building2 className="h-5 w-5 text-primary" />}
          description="Total registered divisions"
        />
        <StatCard
          title="Active Departments"
          value={activeCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          description="Operational departments"
        />
        <StatCard
          title="Inactive"
          value={inactiveCount}
          icon={<XCircle className="h-5 w-5 text-muted-foreground" />}
          description="Decommissioned divisions"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search department name, code..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DepartmentStatus | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable<DepartmentItem>
        data={departments}
        columns={columns}
        actions={rowActions}
        rowKey={(d) => d._id}
        isLoading={isLoading}
        emptyTitle="No departments found"
        emptyDescription="Create your first department to start assigning staff."
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.name}` : 'Add Department'}
        description="Configure department code, name, and operational details."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGrid cols={2}>
            <FormField id="dept-name" label="Department Name" error={errors.name?.message} required>
              <Input
                id="dept-name"
                {...register('name')}
                placeholder="e.g. Front Office"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="dept-code" label="Department Code" error={errors.code?.message} required>
              <Input
                id="dept-code"
                {...register('code')}
                placeholder="e.g. FO"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormField id="dept-status" label="Status" error={errors.status?.message} required>
            <Select
              id="dept-status"
              {...register('status')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField id="dept-description" label="Description" error={errors.description?.message}>
            <Textarea
              id="dept-description"
              {...register('description')}
              placeholder="e.g. Handles guest check-ins, reservations, and front desk services"
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingDept ? 'Save Changes' : 'Create Department'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        onConfirm={() => void handleDeleteDept()}
        title="Delete Department"
        message={`Are you sure you want to delete department "${deptToDelete?.name}"? Staff members assigned to this department will need to be reassigned.`}
        confirmLabel="Delete Department"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
