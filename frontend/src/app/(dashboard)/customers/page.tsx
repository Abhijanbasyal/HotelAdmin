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
  CreditCard,
  Phone,
  Mail,
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
  ImageUploader,
  type ColumnDef,
  type RowAction,
} from '@/components';
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  type CustomerItem,
  type CustomerStatus,
  type CustomerIdType,
} from '@/services/api/customer.api';
import { getAssetUrl } from '@/services/api/asset.api';
import { formatDate } from '@/utils/format';
import { ROUTES } from '@/config/routes';

const customerSchema = z.object({
  name: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(5, 'Phone number must be at least 5 characters')
    .max(30, 'Phone cannot exceed 30 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  address: z.string().trim().max(300, 'Address cannot exceed 300 characters').optional(),
  idType: z.enum(['passport', 'id_card', 'driving_license', 'other']).default('passport'),
  idNumber: z.string().trim().max(50, 'ID number cannot exceed 50 characters').optional(),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  avatarUrl: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [idTypeFilter, setIdTypeFilter] = useState<CustomerIdType | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      idType: 'passport',
      idNumber: '',
      notes: '',
      avatarUrl: '',
      status: 'active',
    },
  });

  const selectedAvatar = watch('avatarUrl');

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listCustomers({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        idType: idTypeFilter || undefined,
      });
      setCustomers(res.data);
      setTotal(res.meta.pagination.total);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter, idTypeFilter]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      phone: '',
      email: '',
      address: '',
      idType: 'passport',
      idNumber: '',
      notes: '',
      avatarUrl: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust: CustomerItem) => {
    setEditingCustomer(cust);
    reset({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      address: cust.address || '',
      idType: cust.idType || 'passport',
      idNumber: cust.idNumber || '',
      notes: cust.notes || '',
      avatarUrl: cust.avatarUrl || '',
      status: cust.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id || editingCustomer._id, values);
        toast.success(`Customer "${values.name}" updated successfully`);
      } else {
        await createCustomer(values);
        toast.success(`Customer "${values.name}" created successfully`);
      }
      setIsModalOpen(false);
      void fetchCustomers();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.id || customerToDelete._id);
      toast.success(`Customer "${customerToDelete.name}" soft-deleted`);
      setCustomerToDelete(null);
      void fetchCustomers();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to delete customer';
      toast.error(msg);
    }
  };

  const handleRestore = async (cust: CustomerItem) => {
    try {
      await restoreCustomer(cust.id || cust._id);
      toast.success(`Customer "${cust.name}" restored successfully`);
      void fetchCustomers();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to restore customer';
      toast.error(msg);
    }
  };

  const columns: ColumnDef<CustomerItem>[] = [
    {
      id: 'avatar',
      header: 'Photo',
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
      header: 'Customer',
      sortKey: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Phone className="h-3 w-3 text-slate-400" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email & Address',
      sortKey: 'email',
      cell: (row) => (
        <div>
          {row.email ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <Mail className="h-3 w-3 text-slate-400" />
              <span>{row.email}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No email provided</span>
          )}
          {row.address && (
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
              {row.address}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'idDocument',
      header: 'ID Document',
      cell: (row) => {
        const idLabel =
          row.idType === 'passport'
            ? 'Passport'
            : row.idType === 'id_card'
              ? 'National ID'
              : row.idType === 'driving_license'
                ? "Driver's License"
                : 'Other ID';

        return (
          <div className="flex items-center gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{idLabel}:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {row.idNumber || '—'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (row) => <ActiveBadge isActive={row.status === 'active'} />,
    },
    {
      id: 'createdAt',
      header: 'Registered',
      sortKey: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const actions: RowAction<CustomerItem>[] = [
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
      onClick: (row) => setCustomerToDelete(row),
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
        title="Customers"
        description="Manage hotel guests, contact information, identification details, and VIP notes."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: ROUTES.DASHBOARD },
              { label: 'Customers' },
            ]}
          />
        }
        actions={
          <Button size="sm" onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, phone, email, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CustomerStatus | '');
              setPage(1);
            }}
            className="w-36"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

          <Select
            value={idTypeFilter}
            onChange={(e) => {
              setIdTypeFilter(e.target.value as CustomerIdType | '');
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All ID Types</option>
            <option value="passport">Passport</option>
            <option value="id_card">National ID</option>
            <option value="driving_license">Driver&apos;s License</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      {/* Shared DataTable */}
      <DataTable
        data={customers}
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
        emptyTitle="No customers found"
        emptyDescription="Click 'Add Customer' to register your first guest."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Register New Customer'}
        description="Enter guest personal info, contact details, and identification credentials."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Avatar Photo */}
          <ImageUploader
            label="Customer Photo / Document Photo"
            entityType="Customer"
            value={selectedAvatar}
            onChange={(val) => setValue('avatarUrl', typeof val === 'string' ? val : val[0] || '')}
            disabled={isSubmitting}
          />

          <FormGrid cols={2}>
            <FormField id="cust-name" label="Full Name" required error={errors.name?.message}>
              <Input
                id="cust-name"
                {...register('name')}
                placeholder="e.g. John Doe"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="cust-phone" label="Phone Number" required error={errors.phone?.message}>
              <Input
                id="cust-phone"
                {...register('phone')}
                placeholder="e.g. +1-555-0199"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField id="cust-email" label="Email Address" error={errors.email?.message}>
              <Input
                id="cust-email"
                type="email"
                {...register('email')}
                placeholder="e.g. john@example.com"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="cust-status" label="Status" error={errors.status?.message}>
              <Select id="cust-status" {...register('status')} disabled={isSubmitting}>
                <option value="active">Active Guest</option>
                <option value="inactive">Inactive</option>
              </Select>
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField id="cust-idType" label="Identification Document" error={errors.idType?.message}>
              <Select id="cust-idType" {...register('idType')} disabled={isSubmitting}>
                <option value="passport">Passport</option>
                <option value="id_card">National Identity Card</option>
                <option value="driving_license">Driver&apos;s License</option>
                <option value="other">Other Document</option>
              </Select>
            </FormField>

            <FormField id="cust-idNumber" label="Document / ID Number" error={errors.idNumber?.message}>
              <Input
                id="cust-idNumber"
                {...register('idNumber')}
                placeholder="e.g. PA987654321"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormField id="cust-address" label="Home Address / City" error={errors.address?.message}>
            <Input
              id="cust-address"
              {...register('address')}
              placeholder="e.g. 742 Evergreen Terrace, Springfield"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField id="cust-notes" label="Special Preferences & Guest Notes" error={errors.notes?.message}>
            <Textarea
              id="cust-notes"
              {...register('notes')}
              placeholder="e.g. Vegetarian diet, quiet room preference, VIP member..."
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingCustomer ? 'Save Changes' : 'Register Customer'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.name}"? Historical bookings and guest records will be preserved.`}
        confirmLabel="Soft Delete Customer"
        variant="danger"
      />
    </div>
  );
}
