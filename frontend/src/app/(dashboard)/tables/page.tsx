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
  Users,
  Grid,
  CheckCircle2,
  Clock,
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
  FormGrid,
  StatCard,
  type ColumnDef,
  type RowAction,
  type BadgeVariant,
} from '@/components';
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  restoreTable,
  type TableItem,
  type TableLocation,
  type TableStatus,
} from '@/services/api/table.api';

const tableSchema = z.object({
  tableNumber: z
    .string({ required_error: 'Table number is required' })
    .trim()
    .min(1, 'Table number is required')
    .max(20, 'Table number cannot exceed 20 characters'),
  capacity: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'Capacity must be between 1 and 50',
    }),
  location: z.enum(['indoor', 'outdoor', 'terrace', 'rooftop', 'bar', 'vip'], {
    required_error: 'Location is required',
  }),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance']).default('available'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional(),
});

type TableFormValues = z.infer<typeof tableSchema>;

const LOCATION_OPTIONS = [
  { value: 'indoor', label: 'Indoor Dining' },
  { value: 'outdoor', label: 'Outdoor Garden' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'rooftop', label: 'Rooftop Lounge' },
  { value: 'bar', label: 'Bar Area' },
  { value: 'vip', label: 'VIP Lounge' },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'maintenance', label: 'Under Maintenance' },
];

const getStatusBadgeVariant = (status: TableStatus): BadgeVariant => {
  switch (status) {
    case 'available':
      return 'success';
    case 'occupied':
      return 'warning';
    case 'reserved':
      return 'info';
    case 'maintenance':
      return 'neutral';
    default:
      return 'neutral';
  }
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<TableLocation | ''>('');
  const [statusFilter, setStatusFilter] = useState<TableStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [tableToDelete, setTableToDelete] = useState<TableItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      tableNumber: '',
      capacity: 4,
      location: 'indoor',
      status: 'available',
      description: '',
    },
  });

  const fetchTables = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listTables({
        page,
        limit,
        search: search.trim() || undefined,
        location: locationFilter || undefined,
        status: statusFilter || undefined,
      });
      setTables(res.data);
      setTotal(res.meta?.pagination?.total ?? res.data.length);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to load tables');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, locationFilter, statusFilter]);

  useEffect(() => {
    void fetchTables();
  }, [fetchTables]);

  const handleOpenCreateModal = () => {
    setEditingTable(null);
    reset({
      tableNumber: '',
      capacity: 4,
      location: 'indoor',
      status: 'available',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (table: TableItem) => {
    setEditingTable(table);
    reset({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location,
      status: table.status,
      description: table.description || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: TableFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingTable) {
        await updateTable(editingTable._id, values);
        toast.success(`Table "${values.tableNumber}" updated successfully`);
      } else {
        await createTable(values);
        toast.success(`Table "${values.tableNumber}" created successfully`);
      }
      setIsModalOpen(false);
      void fetchTables();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      setIsSubmitting(true);
      await deleteTable(tableToDelete._id);
      toast.success(`Table "${tableToDelete.tableNumber}" deleted successfully`);
      setTableToDelete(null);
      void fetchTables();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to delete table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreTable = async (table: TableItem) => {
    try {
      await restoreTable(table._id);
      toast.success(`Table "${table.tableNumber}" restored successfully`);
      void fetchTables();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to restore table');
    }
  };

  // Metrics summary
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  const columns: ColumnDef<TableItem>[] = [
    {
      id: 'tableNumber',
      header: 'Table Number',
      cell: (table) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
            {table.tableNumber.slice(0, 3)}
          </div>
          <div>
            <div className="font-semibold text-foreground">{table.tableNumber}</div>
            {table.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {table.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'capacity',
      header: 'Capacity',
      cell: (table) => (
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{table.capacity} guests</span>
        </div>
      ),
    },
    {
      id: 'location',
      header: 'Location / Zone',
      cell: (table) => {
        const loc = LOCATION_OPTIONS.find((l) => l.value === table.location);
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground capitalize">
            {loc?.label || table.location}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (table) => (
        <StatusBadge
          variant={getStatusBadgeVariant(table.status)}
          label={table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        />
      ),
    },
  ];

  const rowActions: RowAction<TableItem>[] = [
    {
      label: 'Edit Table',
      icon: <Edit2 className="h-4 w-4 text-primary" />,
      onClick: handleOpenEditModal,
    },
    {
      label: 'Delete Table',
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      variant: 'danger',
      onClick: (table) => setTableToDelete(table),
      hidden: (table) => table.isDeleted,
    },
    {
      label: 'Restore Table',
      icon: <RotateCcw className="h-4 w-4 text-success" />,
      onClick: (table) => void handleRestoreTable(table),
      hidden: (table) => !table.isDeleted,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Tables & Seating"
        description="Monitor table availability, zone capacities, and dining floor allocation in real time."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Tables', href: '/tables' },
            ]}
          />
        }
        actions={
          <Button onClick={handleOpenCreateModal} size="md">
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tables"
          value={total}
          icon={<Grid className="h-5 w-5 text-primary" />}
          description="Total active floor tables"
        />
        <StatCard
          title="Available"
          value={availableCount}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          description="Ready for immediate seating"
        />
        <StatCard
          title="Occupied"
          value={occupiedCount}
          icon={<Users className="h-5 w-5 text-amber-500" />}
          description="Currently serving guests"
        />
        <StatCard
          title="Reserved"
          value={reservedCount}
          icon={<Clock className="h-5 w-5 text-sky-500" />}
          description="Upcoming reserved slots"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search table number or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value as TableLocation | '');
              setPage(1);
            }}
            options={[{ value: '', label: 'All Locations' }, ...LOCATION_OPTIONS]}
            className="w-44"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as TableStatus | '');
              setPage(1);
            }}
            options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
            className="w-44"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable<TableItem>
        data={tables}
        columns={columns}
        actions={rowActions}
        rowKey={(table) => table._id}
        isLoading={isLoading}
        emptyTitle="No tables found"
        emptyDescription="Try adjusting your search filters or create a new table."
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
        title={editingTable ? `Edit Table ${editingTable.tableNumber}` : 'Add New Table'}
        description="Configure table number, zone location, and maximum seating capacity."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormGrid cols={2}>
            <FormField id="table-number" label="Table Number" error={errors.tableNumber?.message} required>
              <Input
                id="table-number"
                {...register('tableNumber')}
                placeholder="e.g. T-101"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="table-capacity" label="Capacity (Seats)" error={errors.capacity?.message} required>
              <Input
                id="table-capacity"
                type="number"
                min={1}
                max={50}
                {...register('capacity', { valueAsNumber: true })}
                placeholder="e.g. 4"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField id="table-location" label="Location / Zone" error={errors.location?.message} required>
              <Select
                id="table-location"
                {...register('location')}
                options={LOCATION_OPTIONS}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="table-status" label="Status" error={errors.status?.message} required>
              <Select
                id="table-status"
                {...register('status')}
                options={STATUS_OPTIONS}
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormField id="table-description" label="Description & Notes" error={errors.description?.message}>
            <Textarea
              id="table-description"
              {...register('description')}
              placeholder="e.g. Near window with ocean view, accessible for wheelchairs"
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingTable ? 'Save Changes' : 'Create Table'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!tableToDelete}
        onClose={() => setTableToDelete(null)}
        onConfirm={() => void handleDeleteTable()}
        title="Delete Table"
        message={`Are you sure you want to delete table "${tableToDelete?.tableNumber}"? Any upcoming confirmed bookings on this table must be rescheduled first.`}
        confirmLabel="Delete Table"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
