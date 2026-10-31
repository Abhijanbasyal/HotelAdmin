'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '@/components/ui/Button';
import { LoadingSkeleton, EmptyState, ErrorState } from '@/components/shared/States';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  /** Unique column identifier */
  id: string;
  /** Column header label */
  header: string;
  /** Field to use for sort (undefined = not sortable) */
  sortKey?: string;
  /** Custom cell renderer — receives the row data */
  cell: (row: T) => React.ReactNode;
  /** Fixed width (e.g. '120px') */
  width?: string;
  /** Minimum width */
  minWidth?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on smaller screens */
  hideOnMobile?: boolean;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  /** Controls visibility — called per-row */
  hidden?: (row: T) => boolean;
  /** Style the action as destructive */
  variant?: 'default' | 'danger';
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface DataTableProps<T> {
  /** Array of column definitions */
  columns: ColumnDef<T>[];
  /** Row data */
  data: T[];
  /** Function that returns a unique key for each row */
  rowKey: (row: T) => string;
  /** Per-row action items */
  actions?: RowAction<T>[];
  /** Pagination state */
  pagination?: PaginationState;
  /** Called when page changes */
  onPageChange?: (page: number) => void;
  /** Called when page size changes */
  onPageSizeChange?: (size: number) => void;
  /** Current sort state */
  sort?: SortState;
  /** Called when a sortable column header is clicked */
  onSortChange?: (sort: SortState) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Retry callback when in error state */
  onRetry?: () => void;
  /** Message shown when data is empty */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Optional empty state action */
  emptyAction?: { label: string; onClick: () => void };
  /** Optional row click handler */
  onRowClick?: (row: T) => void;
  /** Class name for the outer container */
  className?: string;
}

// ── DataTable ──────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  rowKey,
  actions,
  pagination,
  onPageChange,
  onPageSizeChange,
  sort,
  onSortChange,
  isLoading,
  error,
  onRetry,
  emptyTitle = 'No results',
  emptyDescription = 'No records were found.',
  emptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [openActionRow, setOpenActionRow] = useState<string | null>(null);

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortKey || !onSortChange) return;
    const nextDirection: SortDirection =
      sort?.field === column.sortKey && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ field: column.sortKey, direction: nextDirection });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
        <div className="p-6">
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border bg-card', className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {/* Note: no overflow-hidden here — allows the fixed-position action dropdown to escape */}
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm" role="grid">
            {/* Header */}
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    style={{ width: col.width, minWidth: col.minWidth }}
                    className={cn(
                      'px-4 py-3 font-medium text-muted-foreground',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      !col.align && 'text-left',
                      col.hideOnMobile && 'hidden md:table-cell',
                      col.sortKey && 'cursor-pointer select-none hover:text-foreground transition-colors'
                    )}
                    onClick={() => handleSort(col)}
                    aria-sort={
                      sort && sort.field === col.sortKey
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortKey && (
                        <SortIcon
                          active={Boolean(sort && sort.field === col.sortKey)}
                          direction={sort && sort.field === col.sortKey ? sort.direction : undefined}
                        />
                      )}
                    </span>
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground w-[80px]">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-border">
              {data.map((row, rowIndex) => {
                const key = rowKey
                  ? rowKey(row)
                  : ((row as Record<string, unknown>)._id as string) ||
                    ((row as Record<string, unknown>).id as string) ||
                    String(rowIndex);
                const isActionOpen = openActionRow === key;

                return (
                  <tr
                    key={key}
                    className={cn(
                      'group transition-colors duration-100',
                      'hover:bg-muted/30',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') onRowClick(row);
                          }
                        : undefined
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3 text-foreground',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.hideOnMobile && 'hidden md:table-cell'
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}

                    {/* Actions column */}
                    {actions && actions.length > 0 && (
                      <RowActionsCell
                        actions={actions}
                        row={row}
                        rowKey={key}
                        isOpen={isActionOpen}
                        onToggle={() => setOpenActionRow(isActionOpen ? null : key)}
                        onClose={() => setOpenActionRow(null)}
                      />
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {pagination && (
        <TablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

// ── Sort Icon ──────────────────────────────────────────────────────────────────

function SortIcon({ active, direction }: { active: boolean; direction?: SortDirection }) {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />;
  if (direction === 'asc') return <ChevronUp className="h-3.5 w-3.5" aria-hidden />;
  return <ChevronDown className="h-3.5 w-3.5" aria-hidden />;
}

// ── Row Actions Cell ───────────────────────────────────────────────────────────
// A <td> wrapper that holds the trigger button and the fixed-position dropdown.
// Using position:fixed on the dropdown means it escapes overflow:hidden/auto
// ancestors (the scrollable table wrapper) and always renders fully in the
// viewport — flipping upward when there is not enough room below.

interface RowActionsCellProps<T> {
  actions: RowAction<T>[];
  row: T;
  rowKey: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function RowActionsCell<T>({
  actions,
  row,
  rowKey,
  isOpen,
  onToggle,
  onClose,
}: RowActionsCellProps<T>) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <td
      className="px-4 py-3 text-right"
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        ref={triggerRef}
        icon={<MoreHorizontal className="h-4 w-4" />}
        aria-label={`Actions for row ${rowKey}`}
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
      />
      {isOpen && (
        <ActionDropdown
          actions={actions}
          row={row}
          onClose={onClose}
          triggerRef={triggerRef}
        />
      )}
    </td>
  );
}

// ── Action Dropdown ────────────────────────────────────────────────────────────

interface ActionDropdownProps<T> {
  actions: RowAction<T>[];
  row: T;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

function ActionDropdown<T>({ actions, row, onClose, triggerRef }: ActionDropdownProps<T>) {
  const visibleActions = actions.filter((a) => !a.hidden?.(row));
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden', position: 'fixed' });

  useEffect(() => {
    if (!triggerRef.current) return;

    const btn = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    // Estimate height: 40px per item, minimum 80px
    const estimatedHeight = menuEl ? menuEl.offsetHeight : visibleActions.length * 40 + 8;
    const spaceBelow = window.innerHeight - btn.bottom;
    const openUpward = spaceBelow < estimatedHeight + 8;

    setStyle({
      position: 'fixed',
      right: window.innerWidth - btn.right,
      top: openUpward ? undefined : btn.bottom + 4,
      bottom: openUpward ? window.innerHeight - btn.top + 4 : undefined,
      minWidth: 160,
      visibility: 'visible',
    });
  }, [triggerRef, visibleActions.length]);

  return (
    <>
      {/* Invisible overlay to close dropdown when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        ref={menuRef}
        style={style}
        className={cn(
          'z-50',
          'min-w-[160px] rounded-lg border border-border bg-card shadow-dropdown',
          'py-1 animate-fade-in'
        )}
        role="menu"
      >
        {visibleActions.map((action) => (
          <button
            key={action.label}
            role="menuitem"
            className={cn(
              'flex w-full items-center gap-2.5 px-3 py-2',
              'text-sm transition-colors duration-100',
              'hover:bg-muted',
              action.variant === 'danger'
                ? 'text-danger hover:text-danger'
                : 'text-foreground'
            )}
            onClick={() => {
              action.onClick(row);
              onClose();
            }}
          >
            {action.icon && <span aria-hidden className="shrink-0">{action.icon}</span>}
            {action.label}
          </button>
        ))}
        {visibleActions.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted-foreground">No actions</p>
        )}
      </div>
    </>
  );
}

// ── Table Pagination ───────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface TablePaginationProps {
  pagination: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function TablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const { page, pageSize, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 px-1">
      {/* Results count */}
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total.toLocaleString()}`}
      </p>

      <div className="flex items-center gap-3 order-1 sm:order-2">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange?.(1);
              }}
              className={cn(
                'h-8 rounded border border-input bg-transparent px-2 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange?.(1)}
            disabled={page <= 1}
            aria-label="First page"
          >
            «
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ‹
          </Button>
          <span className="text-sm text-foreground px-2 min-w-[80px] text-center">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            ›
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange?.(totalPages)}
            disabled={page >= totalPages}
            aria-label="Last page"
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
}
