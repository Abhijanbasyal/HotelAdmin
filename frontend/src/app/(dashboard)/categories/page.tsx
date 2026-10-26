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
  Tag,
  Layers,
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
  ImageUploader,
  type ColumnDef,
  type RowAction,
} from '@/components';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  type CategoryItem,
} from '@/services/api/category.api';
import { getAssetUrl } from '@/services/api/asset.api';
import { formatDate } from '@/utils/format';

const categorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional(),
  image: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      image: '',
      status: 'active',
    },
  });

  const selectedImage = watch('image');

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listCategories({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setCategories(res.data);
      setTotal(res.meta.pagination.total);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    reset({
      name: '',
      description: '',
      image: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      status: cat.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id || editingCategory._id, values);
        toast.success(`Category "${values.name}" updated successfully`);
      } else {
        await createCategory(values);
        toast.success(`Category "${values.name}" created successfully`);
      }
      setIsModalOpen(false);
      void fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id || categoryToDelete._id);
      toast.success(`Category "${categoryToDelete.name}" soft-deleted`);
      setCategoryToDelete(null);
      void fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to delete category';
      toast.error(msg);
    }
  };

  const handleRestore = async (cat: CategoryItem) => {
    try {
      await restoreCategory(cat.id || cat._id);
      toast.success(`Category "${cat.name}" restored successfully`);
      void fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to restore category';
      toast.error(msg);
    }
  };

  const columns: ColumnDef<CategoryItem>[] = [
    {
      id: 'image',
      header: 'Cover',
      cell: (row) => (
        <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 flex items-center justify-center">
          {row.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAssetUrl(row.image)}
              alt={row.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Layers className="h-5 w-5 text-slate-400" />
          )}
        </div>
      ),
    },
    {
      id: 'name',
      header: 'Category Name',
      sortKey: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
          {row.description && (
            <div className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'productCount',
      header: 'Products',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
          <Tag className="h-3 w-3 text-primary" />
          {row.productCount ?? 0} item{(row.productCount ?? 0) === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <ActiveBadge isActive={row.status === 'active'} />
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const actions: RowAction<CategoryItem>[] = [
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
      onClick: (row) => setCategoryToDelete(row),
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
        title="Categories"
        description="Organize your hotel food, beverage, amenities, and room service products into categories."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Products', href: '/products' },
              { label: 'Categories' },
            ]}
          />
        }
        actions={
          <Button size="sm" onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'active' | 'inactive' | '');
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>

      {/* Shared DataTable */}
      <DataTable
        data={categories}
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
        emptyTitle="No categories found"
        emptyDescription="Click 'Add Category' to create your first category."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        description="Fill in category details. Upload an image to visually identify this category on POS and menus."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Category Image Uploader */}
          <ImageUploader
            label="Category Cover Image"
            entityType="Category"
            value={selectedImage}
            onChange={(val) => setValue('image', typeof val === 'string' ? val : val[0] || '')}
          />

          <FormField label="Category Name" required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="e.g. Beverages, Breakfast, Spa"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Brief description of items included in this category..."
              rows={3}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="Status" error={errors.status?.message}>
            <Select {...register('status')} disabled={isSubmitting}>
              <option value="active">Active (Visible)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </Select>
          </FormField>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel={editingCategory ? 'Save Changes' : 'Create Category'}
            onCancel={() => setIsModalOpen(false)}
          />
        </form>
      </Modal>

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? Items assigned to this category must be reassigned first.`}
        confirmLabel="Soft Delete Category"
        variant="danger"
      />
    </div>
  );
}
