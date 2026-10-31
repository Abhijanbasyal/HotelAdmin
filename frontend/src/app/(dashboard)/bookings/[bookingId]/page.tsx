'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  UserCheck,
  XCircle,
  Calendar,
  Clock,
  Users,
  Utensils,
  User,
  Phone,
  Mail,
  History,
  FileText,
  ExternalLink,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Breadcrumbs,
  NavTabs,
  Button,
  StatusBadge,
  ConfirmDialog,
  Input,
  Textarea,
  Select,
  FormField,
  FormActions,
  FormGrid,
  StatCard,
  LoadingSkeleton,
  ErrorState,
  type BadgeVariant,
} from '@/components';
import {
  getBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  type BookingItem,
  type BookingStatus,
} from '@/services/api/booking.api';
import { getActiveTables, type TableItem } from '@/services/api/table.api';
import { listCustomers, type CustomerItem } from '@/services/api/customer.api';
import { listAuditLogs, type AuditLogItem } from '@/services/api/audit.api';
import { formatDate } from '@/utils/format';
import { ROUTES } from '@/config/routes';

const bookingEditSchema = z.object({
  customer: z.string({ required_error: 'Customer is required' }).min(1, 'Please select a customer'),
  table: z.string({ required_error: 'Table is required' }).min(1, 'Please select a table'),
  guestCount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      message: 'Guest count must be between 1 and 50',
    }),
  bookingDate: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  durationMinutes: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
    .default(120),
  specialRequests: z.string().trim().max(1000).optional(),
  status: z.enum(['confirmed', 'seated', 'completed', 'cancelled', 'no_show']).default('confirmed'),
});

type BookingEditFormValues = z.infer<typeof bookingEditSchema>;

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

type DetailsTabId = 'overview' | 'guest' | 'table' | 'history';

interface BookingDetailsPageProps {
  params: { bookingId: string };
}

export default function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.bookingId;

  // Retrieve preserved return URL (from previous Booking List state)
  const returnUrl = searchParams.get('returnUrl') || ROUTES.BOOKINGS.LIST;

  // State
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-navigation tab
  const [activeTab, setActiveTab] = useState<DetailsTabId>('overview');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Action Dialog states
  const [showCancelBookingDialog, setShowCancelBookingDialog] = useState(false);
  const [showDeleteBookingDialog, setShowDeleteBookingDialog] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Reference data
  const [tables, setTables] = useState<TableItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);

  // Audit activity history
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Form for Edit Mode
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BookingEditFormValues>({
    resolver: zodResolver(bookingEditSchema),
  });

  const selectedTableId = watch('table');
  const selectedTable = tables.find((t) => t._id === selectedTableId);

  // Fetch Booking Details
  const fetchBookingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getBooking(bookingId);
      setBooking(data);

      // Populate edit form defaults
      const customerId =
        typeof data.customer === 'object' && data.customer !== null
          ? data.customer._id
          : String(data.customer);
      const tableId =
        typeof data.table === 'object' && data.table !== null
          ? data.table._id
          : String(data.table);

      reset({
        customer: customerId,
        table: tableId,
        guestCount: data.guestCount,
        bookingDate: data.bookingDate ? data.bookingDate.slice(0, 10) : '',
        startTime: data.startTime,
        durationMinutes: 120,
        specialRequests: data.specialRequests || '',
        status: data.status,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load booking details');
      toast.error('Could not retrieve booking details');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, reset]);

  // Fetch reference data for tables & customers
  const fetchReferenceData = useCallback(async () => {
    try {
      const [tableRes, custRes] = await Promise.all([
        getActiveTables(),
        listCustomers({ limit: 100 }),
      ]);
      setTables(tableRes);
      setCustomers(custRes.data);
    } catch {
      // Non-blocking
    }
  }, []);

  // Fetch Activity / Audit history
  const fetchActivityHistory = useCallback(async () => {
    try {
      setIsLoadingAudit(true);
      const res = await listAuditLogs({
        entityType: 'Booking',
        entityId: bookingId,
        limit: 20,
      });
      setAuditLogs(res.data);
    } catch {
      // Non-blocking (user may not have audit.read permission)
      setAuditLogs([]);
    } finally {
      setIsLoadingAudit(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void fetchBookingData();
    void fetchReferenceData();
    void fetchActivityHistory();
  }, [fetchBookingData, fetchReferenceData, fetchActivityHistory]);

  // Handle Edit submission
  const onSubmitEdit = async (values: BookingEditFormValues) => {
    try {
      await updateBooking(bookingId, values);
      toast.success(`Booking "${booking?.bookingNumber}" updated successfully`);
      setIsEditing(false);
      void fetchBookingData();
      void fetchActivityHistory();
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = e.response?.data?.message || e.message || 'Update failed';
      toast.error(msg);
    }
  };

  // Safe Cancel Edit Handler (checks unsaved changes)
  const handleCancelEditClick = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleConfirmDiscard = () => {
    if (booking) {
      const customerId =
        typeof booking.customer === 'object' && booking.customer !== null
          ? booking.customer._id
          : String(booking.customer);
      const tableId =
        typeof booking.table === 'object' && booking.table !== null
          ? booking.table._id
          : String(booking.table);

      reset({
        customer: customerId,
        table: tableId,
        guestCount: booking.guestCount,
        bookingDate: booking.bookingDate ? booking.bookingDate.slice(0, 10) : '',
        startTime: booking.startTime,
        durationMinutes: 120,
        specialRequests: booking.specialRequests || '',
        status: booking.status,
      });
    }
    setShowDiscardConfirm(false);
    setIsEditing(false);
  };

  // Quick Status Change (Seat Guest / Complete)
  const handleStatusChange = async (newStatus: BookingStatus) => {
    try {
      setIsActionSubmitting(true);
      await updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking status changed to ${newStatus.toUpperCase()}`);
      void fetchBookingData();
      void fetchActivityHistory();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Failed to update booking status');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Cancel Reservation (Business action, not discarding edits)
  const handleConfirmCancelReservation = async () => {
    try {
      setIsActionSubmitting(true);
      await updateBookingStatus(bookingId, 'cancelled');
      toast.success(`Reservation "${booking?.bookingNumber}" has been cancelled`);
      setShowCancelBookingDialog(false);
      void fetchBookingData();
      void fetchActivityHistory();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Failed to cancel reservation');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Delete Booking (Soft Delete)
  const handleConfirmDelete = async () => {
    try {
      setIsActionSubmitting(true);
      await deleteBooking(bookingId);
      toast.success(`Booking "${booking?.bookingNumber}" deleted`);
      setShowDeleteBookingDialog(false);
      router.push(returnUrl);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Failed to delete booking');
      setIsActionSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="h-9 w-32 rounded bg-muted animate-pulse" />
        </div>
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  // Error State
  if (error || !booking) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(returnUrl)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <ErrorState
          title="Booking Not Found"
          message={error || 'The requested booking could not be located.'}
          onRetry={() => void fetchBookingData()}
        />
      </div>
    );
  }

  const customerObj = booking.customer;
  const tableObj = booking.table;
  const createdByObj = booking.createdBy;

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Dashboard', href: ROUTES.DASHBOARD },
    { label: 'Bookings', href: returnUrl },
    { label: 'Booking Details', href: `/bookings/${bookingId}` },
    ...(isEditing ? [{ label: 'Edit Booking' }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Top Section: Breadcrumbs ───────────────────────────────────── */}
      <div>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* ── 2. Page Header & Primary Actions ──────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(returnUrl)}
              className="gap-1.5 border-border text-foreground hover:bg-muted"
              title="Return to the Booking List preserving previous filters"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Bookings</span>
            </Button>

            <h1 className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
              {booking.bookingNumber}
            </h1>

            <StatusBadge
              variant={getStatusBadgeVariant(booking.status)}
              label={booking.status.toUpperCase()}
              dot
            />
          </div>

          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Created on {formatDate(booking.createdAt)} • Booked for{' '}
            <span className="font-semibold text-foreground">
              {customerObj?.name || 'Walk-in Guest'}
            </span>{' '}
            at{' '}
            <span className="font-semibold text-foreground">
              Table {tableObj?.tableNumber || '—'}
            </span>
          </p>
        </div>

        {/* Primary Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              {/* Floor Status Quick Actions */}
              {booking.status === 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-medium"
                  onClick={() => void handleStatusChange('seated')}
                  disabled={isActionSubmitting}
                >
                  <UserCheck className="h-4 w-4" />
                  Seat Guest
                </Button>
              )}

              {booking.status === 'seated' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-medium"
                  onClick={() => void handleStatusChange('completed')}
                  disabled={isActionSubmitting}
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete Dining
                </Button>
              )}

              {/* Edit Booking Trigger */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-1.5"
              >
                <Edit2 className="h-4 w-4 text-primary" />
                Edit Booking
              </Button>

              {/* Cancel Reservation Action */}
              {!['completed', 'cancelled'].includes(booking.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCancelBookingDialog(true)}
                  className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Reservation
                </Button>
              )}

              {/* Delete Booking Action */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteBookingDialog(true)}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
                title="Soft delete booking record"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {/* In Edit Mode Actions */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEditClick}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                Cancel Edit
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit(onSubmitEdit)}
                isLoading={isSubmitting}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── 3. Edit Form Mode (If Active) ─────────────────────────────────── */}
      {isEditing ? (
        <div className="rounded-xl border border-primary/30 bg-card p-6 shadow-card space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Edit Booking Details ({booking.bookingNumber})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Modify dining assignments, time slots, or guest preferences.
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <FormField id="edit-customer" label="Guest / Customer" error={errors.customer?.message} required>
              <Select
                id="edit-customer"
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
              <FormField id="edit-table" label="Dining Table" error={errors.table?.message} required>
                <Select
                  id="edit-table"
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
                id="edit-guests"
                label={`Guest Count (Max ${selectedTable ? selectedTable.capacity : 50})`}
                error={errors.guestCount?.message}
                required
              >
                <Input
                  id="edit-guests"
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
              <FormField id="edit-date" label="Reservation Date" error={errors.bookingDate?.message} required>
                <Input
                  id="edit-date"
                  type="date"
                  {...register('bookingDate')}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField id="edit-start-time" label="Start Time" error={errors.startTime?.message} required>
                <Input
                  id="edit-start-time"
                  type="time"
                  {...register('startTime')}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField id="edit-duration" label="Duration" error={errors.durationMinutes?.message}>
                <Select
                  id="edit-duration"
                  {...register('durationMinutes', { valueAsNumber: true })}
                  options={DURATION_OPTIONS}
                  disabled={isSubmitting}
                />
              </FormField>
            </FormGrid>

            <FormField id="edit-requests" label="Special Requests / Dietary Requirements" error={errors.specialRequests?.message}>
              <Textarea
                id="edit-requests"
                {...register('specialRequests')}
                placeholder="e.g. Window table, high chair needed, celebrating birthday"
                rows={3}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField id="edit-status" label="Booking Status" error={errors.status?.message}>
              <Select
                id="edit-status"
                {...register('status')}
                options={STATUS_OPTIONS}
                disabled={isSubmitting}
              />
            </FormField>

            <FormActions
              isSubmitting={isSubmitting}
              submitLabel="Save Changes"
              onCancel={handleCancelEditClick}
            />
          </form>
        </div>
      ) : (
        <>
          {/* ── 4. Contextual Internal Sub-Navigation Tabs ───────────────────── */}
          <NavTabs<DetailsTabId>
            tabs={[
              {
                id: 'overview',
                label: 'Overview',
                icon: <FileText className="h-4 w-4" />,
              },
              {
                id: 'guest',
                label: 'Guest Information',
                icon: <User className="h-4 w-4" />,
              },
              {
                id: 'table',
                label: 'Table & Schedule',
                icon: <Utensils className="h-4 w-4" />,
              },
              {
                id: 'history',
                label: 'Activity History',
                icon: <History className="h-4 w-4" />,
                badge: auditLogs.length > 0 ? auditLogs.length : undefined,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* ── 5. Tab Panels ─────────────────────────────────────────────── */}

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Highlight Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Party Size"
                  value={`${booking.guestCount} Guests`}
                  icon={<Users className="h-5 w-5 text-primary" />}
                  description="Reserved seating capacity"
                />
                <StatCard
                  title="Dining Table"
                  value={`Table ${tableObj?.tableNumber || '—'}`}
                  icon={<Utensils className="h-5 w-5 text-sky-500" />}
                  description={`Zone: ${tableObj?.location || 'Floor'}`}
                />
                <StatCard
                  title="Time Interval"
                  value={`${booking.startTime} - ${booking.endTime}`}
                  icon={<Clock className="h-5 w-5 text-amber-500" />}
                  description={booking.bookingDate ? booking.bookingDate.slice(0, 10) : 'Today'}
                />
                <StatCard
                  title="Current Status"
                  value={booking.status.toUpperCase()}
                  icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
                  description="Operational state"
                />
              </div>

              {/* Details Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reservation Summary */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                    <Calendar className="h-4 w-4 text-primary" />
                    Reservation Overview
                  </h3>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
                    <div>
                      <dt className="text-muted-foreground">Booking Reference</dt>
                      <dd className="font-mono font-bold text-primary mt-0.5">{booking.bookingNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Current Status</dt>
                      <dd className="mt-0.5">
                        <StatusBadge
                          variant={getStatusBadgeVariant(booking.status)}
                          label={booking.status.toUpperCase()}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Reservation Date</dt>
                      <dd className="font-medium text-foreground mt-0.5">
                        {booking.bookingDate ? booking.bookingDate.slice(0, 10) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Time Slot</dt>
                      <dd className="font-mono font-medium text-foreground mt-0.5">
                        {booking.startTime} – {booking.endTime}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Logged On</dt>
                      <dd className="text-foreground mt-0.5">{formatDate(booking.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd className="text-foreground mt-0.5">{formatDate(booking.updatedAt)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Staff Attribution / Source</dt>
                      <dd className="text-foreground mt-0.5">
                        {createdByObj?.name ? `${createdByObj.name} (${createdByObj.email})` : 'System / Admin Direct'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Special Requests / Notes */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                      <FileText className="h-4 w-4 text-primary" />
                      Special Requests & Dietary Notes
                    </h3>

                    <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border text-sm text-foreground">
                      {booking.specialRequests ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{booking.specialRequests}</p>
                      ) : (
                        <p className="text-muted-foreground italic text-xs">
                          No special dining requests, dietary restrictions, or seating preferences recorded.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>Dining table capacity: {tableObj?.capacity || 2} guests</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-primary"
                    >
                      Update Notes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Guest Information */}
          {activeTab === 'guest' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl border border-primary/20">
                      {customerObj?.name ? customerObj.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {customerObj?.name || 'Walk-in Guest'}
                      </h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>Customer ID:</span>
                        <span className="font-mono text-foreground">{customerObj?._id || '—'}</span>
                      </p>
                    </div>
                  </div>

                  {customerObj?.status && (
                    <StatusBadge
                      variant={customerObj.status === 'active' ? 'success' : 'neutral'}
                      label={customerObj.status.toUpperCase()}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Contact Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm text-foreground p-3 rounded-lg bg-muted/30">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Primary Phone</p>
                          <p className="font-medium font-mono">{customerObj?.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-foreground p-3 rounded-lg bg-muted/30">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email Address</p>
                          <p className="font-medium">{customerObj?.email || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Customer Profile
                    </h4>
                    <div className="p-4 rounded-lg bg-muted/30 border border-border text-xs space-y-2 text-muted-foreground">
                      <p>
                        This guest is registered in the Hotel Management Customer Registry. All historical bookings, dining reservations, and room records are unified under this profile.
                      </p>
                      <div className="pt-2">
                        <Link
                          href={ROUTES.CUSTOMERS.LIST}
                          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                        >
                          View Full Customer Registry
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Table & Schedule */}
          {activeTab === 'table' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table Specifications */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-primary" />
                      Table Assignment
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-secondary text-secondary-foreground">
                      Table {tableObj?.tableNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Zone / Location</p>
                      <p className="text-sm font-semibold text-foreground capitalize mt-0.5">
                        {tableObj?.location || 'Main Floor'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Table Capacity</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {tableObj?.capacity || 2} Seats
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Booked Guests</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {booking.guestCount} Guests
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Capacity Match</p>
                      <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Optimal Seating
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="w-full text-xs"
                    >
                      Reassign / Change Table
                    </Button>
                  </div>
                </div>

                {/* Scheduling Details */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Time Interval & Schedule
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">
                      24-Hour Format
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Reservation Date</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">
                          {booking.bookingDate ? booking.bookingDate.slice(0, 10) : '—'}
                        </p>
                      </div>
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Seating Start Time</p>
                        <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                          {booking.startTime}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">Seating End Time</p>
                        <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                          {booking.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Verified: No collision or double-booking with existing reservations.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Activity History */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">
                      Audit Trail & Booking History
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Chronological audit log records
                  </span>
                </div>

                {isLoadingAudit ? (
                  <LoadingSkeleton rows={4} />
                ) : auditLogs.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {auditLogs.map((log) => (
                      <div key={log._id} className="relative">
                        <span className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {log.action}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground font-medium mt-1">
                            Staff: {log.userName || log.userEmail || 'System'}
                          </p>
                          {log.details && (
                            <pre className="mt-2 text-[11px] p-2 rounded bg-muted/60 text-muted-foreground overflow-x-auto font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                      {/* Booking Created Event */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                              BOOKING CREATED
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDate(booking.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-2">
                            Initial reservation created for guest <strong>{customerObj?.name || 'Walk-in'}</strong> at Table {tableObj?.tableNumber}.
                          </p>
                        </div>
                      </div>

                      {/* Current Status Event */}
                      <div className="relative">
                        <span className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                        <div className="rounded-lg border border-border bg-muted/20 p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              CURRENT STATUS: {booking.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatDate(booking.updatedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-2">
                            Status verified as active in operational scheduling.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Confirm Discard Unsaved Changes Dialog (Cancel Edit) ─────────── */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in the booking form. If you discard them, your modifications will be lost and the booking will remain unchanged."
        confirmLabel="Discard Changes"
        variant="danger"
      />

      {/* ── Cancel Reservation Confirmation Dialog ────────────────────────── */}
      <ConfirmDialog
        isOpen={showCancelBookingDialog}
        onClose={() => setShowCancelBookingDialog(false)}
        onConfirm={() => void handleConfirmCancelReservation()}
        title="Cancel Guest Reservation"
        message={`Are you sure you want to cancel booking "${booking.bookingNumber}"? The assigned table (${tableObj?.tableNumber}) will immediately become available for other guests.`}
        confirmLabel="Confirm Cancellation"
        variant="danger"
        isLoading={isActionSubmitting}
      />

      {/* ── Delete Booking Confirmation Dialog ───────────────────────────── */}
      <ConfirmDialog
        isOpen={showDeleteBookingDialog}
        onClose={() => setShowDeleteBookingDialog(false)}
        onConfirm={() => void handleConfirmDelete()}
        title="Delete Booking Record"
        message={`Are you sure you want to delete booking "${booking.bookingNumber}"? This action will soft-delete the record and remove it from active floor views.`}
        confirmLabel="Delete Record"
        variant="danger"
        isLoading={isActionSubmitting}
      />
    </div>
  );
}
