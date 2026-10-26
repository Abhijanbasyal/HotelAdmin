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
  Calendar,
  Clock,
  Users,
  CheckCircle,
  UserCheck,
  Utensils,
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
  listBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  restoreBooking,
  type BookingItem,
  type BookingStatus,
} from '@/services/api/booking.api';
import { getActiveTables, type TableItem } from '@/services/api/table.api';
import { listCustomers, type CustomerItem } from '@/services/api/customer.api';
import { formatDate } from '@/utils/format';

const bookingSchema = z.object({
  customer: z.string({ required_error: 'Customer is required' }).min(1, 'Please select a customer'),
  table: z.string({ required_error: 'Table is required' }).min(1, 'Please select a table'),
  guestCount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'Guest count must be between 1 and 50',
    }),
  bookingDate: z
    .string({ required_error: 'Date is required' })
    .min(1, 'Date is required'),
  startTime: z
    .string({ required_error: 'Start time is required' })
    .min(1, 'Start time is required'),
  durationMinutes: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .default(120),
  specialRequests: z.string().trim().max(1000).optional(),
  status: z.enum(['confirmed', 'seated', 'completed', 'cancelled', 'no_show']).default('confirmed'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'seated', label: 'Seated' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

const DURATION_OPTIONS = [
  { value: '60', label: '1 Hour (60 min)' },
  { value: '90', label: '1.5 Hours (90 min)' },
  { value: '120', label: '2 Hours (120 min - Standard)' },
  { value: '150', label: '2.5 Hours (150 min)' },
  { value: '180', label: '3 Hours (180 min - VIP/Dinner)' },
];

const getStatusBadgeVariant = (status: BookingStatus): BadgeVariant => {
  switch (status) {
    case 'confirmed':
      return 'info';
    case 'seated':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'neutral';
    case 'no_show':
      return 'danger';
    default:
      return 'neutral';
  }
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Reference data for dropdowns
  const [tables, setTables] = useState<TableItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<BookingItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer: '',
      table: '',
      guestCount: 2,
      bookingDate: new Date().toISOString().slice(0, 10),
      startTime: '19:00',
      durationMinutes: 120,
      specialRequests: '',
      status: 'confirmed',
    },
  });

  const selectedTableId = watch('table');
  const selectedTable = tables.find((t) => t._id === selectedTableId);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [tableRes, custRes] = await Promise.all([
        getActiveTables(),
        listCustomers({ limit: 100 }),
      ]);
      setTables(tableRes);
      setCustomers(custRes.data);
    } catch {
      // Non-blocking error
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await listBookings({
        page,
        limit,
        search: search.trim() || undefined,
        date: dateFilter || undefined,
        status: statusFilter || undefined,
      });
      setBookings(res.data);
      setTotal(res.meta?.pagination?.total ?? res.data.length);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, dateFilter, statusFilter]);

  useEffect(() => {
    void fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const handleOpenCreateModal = () => {
    setEditingBooking(null);
    reset({
      customer: '',
      table: tables.length > 0 ? tables[0]._id : '',
      guestCount: 2,
      bookingDate: new Date().toISOString().slice(0, 10),
      startTime: '19:00',
      durationMinutes: 120,
      specialRequests: '',
      status: 'confirmed',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (booking: BookingItem) => {
    setEditingBooking(booking);
    const customerId =
      typeof booking.customer === 'object' && booking.customer !== null
        ? booking.customer._id
        : String(booking.customer);
    const tableId =
      typeof booking.table === 'object' && booking.table !== null
        ? booking.table._id
        : String(booking.table);

    const dateStr = booking.bookingDate ? booking.bookingDate.slice(0, 10) : '';

    reset({
      customer: customerId,
      table: tableId,
      guestCount: booking.guestCount,
      bookingDate: dateStr,
      startTime: booking.startTime,
      durationMinutes: 120,
      specialRequests: booking.specialRequests || '',
      status: booking.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: BookingFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingBooking) {
        await updateBooking(editingBooking._id, values);
        toast.success(`Booking "${editingBooking.bookingNumber}" updated successfully`);
      } else {
        const created = await createBooking(values);
        toast.success(`Booking "${created.bookingNumber}" confirmed!`);
      }
      setIsModalOpen(false);
      void fetchBookings();
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (booking: BookingItem, newStatus: BookingStatus) => {
    try {
      await updateBookingStatus(booking._id, newStatus);
      toast.success(`Booking marked as ${newStatus}`);
      void fetchBookings();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to update booking status');
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      setIsSubmitting(true);
      await deleteBooking(bookingToDelete._id);
      toast.success(`Booking "${bookingToDelete.bookingNumber}" cancelled and deleted`);
      setBookingToDelete(null);
      void fetchBookings();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to delete booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreBooking = async (booking: BookingItem) => {
    try {
      await restoreBooking(booking._id);
      toast.success(`Booking "${booking.bookingNumber}" restored`);
      void fetchBookings();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to restore booking');
    }
  };

  // Metrics summary
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const seatedCount = bookings.filter((b) => b.status === 'seated').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const columns: ColumnDef<BookingItem>[] = [
    {
      id: 'bookingNumber',
      header: 'Booking Ref',
      cell: (booking) => (
        <div>
          <div className="font-mono font-semibold text-sm text-primary">
            {booking.bookingNumber}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(booking.createdAt)}
          </div>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Guest',
      cell: (booking) => {
        const cust = booking.customer;
        return (
          <div>
            <div className="font-medium text-foreground">{cust?.name || 'Walk-in Guest'}</div>
            <div className="text-xs text-muted-foreground">{cust?.phone || cust?.email || '—'}</div>
          </div>
        );
      },
    },
    {
      id: 'table',
      header: 'Table & Zone',
      cell: (booking) => {
        const tbl = booking.table;
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground font-bold text-xs">
              {tbl?.tableNumber || '—'}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {tbl?.location || 'Floor'}
            </div>
          </div>
        );
      },
    },
    {
      id: 'schedule',
      header: 'Date & Time Slot',
      cell: (booking) => {
        const dateStr = booking.bookingDate ? booking.bookingDate.slice(0, 10) : '';
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {booking.startTime} - {booking.endTime}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'guestCount',
      header: 'Guests',
      cell: (booking) => (
        <div className="flex items-center gap-1 text-xs text-foreground">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{booking.guestCount} ppl</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (booking) => (
        <StatusBadge
          variant={getStatusBadgeVariant(booking.status)}
          label={booking.status.toUpperCase()}
        />
      ),
    },
    {
      id: 'quickActions',
      header: 'Floor Action',
      cell: (booking) => {
        if (booking.status === 'confirmed') {
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
              onClick={() => void handleQuickStatusChange(booking, 'seated')}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Seat Guest
            </Button>
          );
        }
        if (booking.status === 'seated') {
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => void handleQuickStatusChange(booking, 'completed')}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Complete
            </Button>
          );
        }
        return (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
  ];

  const rowActions: RowAction<BookingItem>[] = [
    {
      label: 'Edit Booking',
      icon: <Edit2 className="h-4 w-4 text-primary" />,
      onClick: handleOpenEditModal,
    },
    {
      label: 'Cancel Booking',
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      variant: 'danger',
      onClick: (b) => setBookingToDelete(b),
      hidden: (b) => b.isDeleted || ['completed', 'cancelled'].includes(b.status),
    },
    {
      label: 'Restore Booking',
      icon: <RotateCcw className="h-4 w-4 text-success" />,
      onClick: (b) => void handleRestoreBooking(b),
      hidden: (b) => !b.isDeleted,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Bookings & Reservations"
        description="Manage dining reservations, time-slot scheduling, and prevent table reservation collisions."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Bookings', href: '/bookings' },
            ]}
          />
        }
        actions={
          <Button onClick={handleOpenCreateModal} size="md">
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reservations"
          value={total}
          icon={<Utensils className="h-5 w-5 text-primary" />}
          description="Total booking records"
        />
        <StatCard
          title="Confirmed"
          value={confirmedCount}
          icon={<Clock className="h-5 w-5 text-sky-500" />}
          description="Upcoming reserved slots"
        />
        <StatCard
          title="Seated Right Now"
          value={seatedCount}
          icon={<Users className="h-5 w-5 text-amber-500" />}
          description="Guests actively dining"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          description="Finished dining sessions"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search booking ref, notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as BookingStatus | '');
              setPage(1);
            }}
            options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
            className="w-40"
          />

          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter('');
                setPage(1);
              }}
              className="text-xs text-muted-foreground"
            >
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable<BookingItem>
        data={bookings}
        columns={columns}
        actions={rowActions}
        rowKey={(booking) => booking._id}
        isLoading={isLoading}
        emptyTitle="No bookings found"
        emptyDescription="Try adjusting your date/status filters or schedule a new guest reservation."
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
        title={editingBooking ? `Edit Booking ${editingBooking.bookingNumber}` : 'New Guest Reservation'}
        description="Assign a table, select time interval, and ensure conflict-free dining reservation."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField id="bkg-customer" label="Guest / Customer" error={errors.customer?.message} required>
            <Select
              id="bkg-customer"
              {...register('customer')}
              options={[
                { value: '', label: '— Select Customer —' },
                ...customers.map((c) => ({
                  value: c._id,
                  label: `${c.name} (${c.phone})`,
                })),
              ]}
              disabled={isSubmitting}
            />
          </FormField>

          <FormGrid cols={2}>
            <FormField id="bkg-table" label="Dining Table" error={errors.table?.message} required>
              <Select
                id="bkg-table"
                {...register('table')}
                options={[
                  { value: '', label: '— Select Table —' },
                  ...tables.map((t) => ({
                    value: t._id,
                    label: `Table ${t.tableNumber} (Seats: ${t.capacity}, ${t.location})`,
                  })),
                ]}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              id="bkg-guests"
              label={`Guest Count (Max ${selectedTable ? selectedTable.capacity : 50})`}
              error={errors.guestCount?.message}
              required
            >
              <Input
                id="bkg-guests"
                type="number"
                min={1}
                max={selectedTable ? selectedTable.capacity : 50}
                {...register('guestCount', { valueAsNumber: true })}
                placeholder="2"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormGrid cols={3}>
            <FormField id="bkg-date" label="Reservation Date" error={errors.bookingDate?.message} required>
              <Input
                id="bkg-date"
                type="date"
                {...register('bookingDate')}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="bkg-start-time" label="Start Time" error={errors.startTime?.message} required>
              <Input
                id="bkg-start-time"
                type="time"
                {...register('startTime')}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="bkg-duration" label="Duration" error={errors.durationMinutes?.message}>
              <Select
                id="bkg-duration"
                {...register('durationMinutes', { valueAsNumber: true })}
                options={DURATION_OPTIONS}
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>

          <FormField id="bkg-requests" label="Special Requests / Dietary Requirements" error={errors.specialRequests?.message}>
            <Textarea
              id="bkg-requests"
              {...register('specialRequests')}
              placeholder="e.g. Window table, high chair needed, celebrating birthday"
              rows={2}
              disabled={isSubmitting}
            />
          </FormField>

          {editingBooking && (
            <FormField id="bkg-status" label="Booking Status" error={errors.status?.message}>
              <Select
                id="bkg-status"
                {...register('status')}
                options={STATUS_OPTIONS}
                disabled={isSubmitting}
              />
            </FormField>
          )}

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingBooking ? 'Save Changes' : 'Confirm Reservation'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Delete / Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={() => void handleDeleteBooking()}
        title="Cancel & Delete Booking"
        message={`Are you sure you want to cancel and delete booking "${bookingToDelete?.bookingNumber}"? The assigned table will immediately become available for other reservations.`}
        confirmLabel="Cancel Reservation"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
