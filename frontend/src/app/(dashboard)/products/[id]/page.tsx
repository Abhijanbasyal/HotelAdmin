'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Breadcrumbs,
  PageHeader,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  FormField,
  FormSection,
  FormActions,
  FormGrid,
  ImageUploader,
  ConfirmDialog,
  ActiveBadge,
  DeletedBadge,
  LoadingSkeleton,
  ErrorState,
} from '@/components';
import {
  getProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  type ProductItem,
} from '@/services/api/product.api';
import { getActiveCategories } from '@/services/api/category.api';
import { formatCurrency, formatDate } from '@/utils/format';
import { ROUTES } from '@/config/routes';

const productSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters'),
  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU cannot exceed 50 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.coerce.number().min(0, 'Cost price must be 0 or greater').optional(),
  stockQuantity: z.coerce.number().int().min(0, 'Stock must be 0 or greater').default(0),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional(),
  images: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      price: 0,
      costPrice: undefined,
      stockQuantity: 0,
      description: '',
      images: [],
      isAvailable: true,
    },
  });

  const currentCategory = watch('category');

  const loadData = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [prod, cats] = await Promise.all([
        getProduct(productId),
        getActiveCategories(),
      ]);

      setProduct(prod);
      setCategories(cats);

      const categoryId =
        typeof prod.category === 'object' && prod.category !== null
          ? (prod.category as { _id?: string; id?: string })._id ||
            (prod.category as { _id?: string; id?: string }).id ||
            ''
          : prod.category || '';

      reset({
        name: prod.name,
        sku: prod.sku,
        category: categoryId,
        price: prod.price,
        costPrice: prod.costPrice,
        stockQuantity: prod.stockQuantity,
        description: prod.description || '',
        images: prod.images || [],
        isAvailable: prod.isAvailable,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to load product details';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [productId, reset]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const generateSku = () => {
    const selectedCat = categories.find((c) => c._id === currentCategory);
    const prefix = selectedCat ? selectedCat.name.substring(0, 3).toUpperCase() : 'PRD';
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timeSnippet = Date.now().toString().slice(-3);
    const generated = `${prefix}-${randomHex}${timeSnippet}`;
    setValue('sku', generated, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!product) return;
    setIsSubmitting(true);
    try {
      const updated = await updateProduct(product.id || product._id, {
        ...values,
        sku: values.sku.toUpperCase(),
      });
      setProduct(updated);
      toast.success(`Product "${updated.name}" updated successfully`);
      reset({
        name: updated.name,
        sku: updated.sku,
        category:
          typeof updated.category === 'object' && updated.category !== null
            ? (updated.category as { _id?: string; id?: string })._id ||
              (updated.category as { _id?: string; id?: string }).id ||
              ''
            : updated.category || '',
        price: updated.price,
        costPrice: updated.costPrice,
        stockQuantity: updated.stockQuantity,
        description: updated.description || '',
        images: updated.images || [],
        isAvailable: updated.isAvailable,
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to update product';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct(product.id || product._id);
      toast.success(`Product "${product.name}" soft-deleted`);
      setIsDeleteDialogOpen(false);
      void loadData();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to delete product';
      toast.error(msg);
    }
  };

  const handleRestore = async () => {
    if (!product) return;
    try {
      const restored = await restoreProduct(product.id || product._id);
      setProduct(restored);
      toast.success(`Product "${restored.name}" restored successfully`);
      void loadData();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to restore product';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="max-w-4xl space-y-6">
        <ErrorState
          title="Product Not Found"
          message={loadError || 'The requested product could not be found or has been permanently removed.'}
          onRetry={() => void loadData()}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push(ROUTES.PRODUCTS.LIST)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku} | Manage details, inventory stock, images, and pricing.`}
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: ROUTES.DASHBOARD },
              { label: 'Products', href: ROUTES.PRODUCTS.LIST },
              { label: product.name },
            ]}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.PRODUCTS.LIST)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {product.isDeleted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRestore()}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Product
              </Button>
            ) : (
              <Button
                variant="danger-outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Soft Delete
              </Button>
            )}
          </div>
        }
      />

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            Current Price
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {formatCurrency(product.price)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Boxes className="h-4 w-4 text-primary" />
            Stock Level
          </div>
          <div className="mt-1 text-lg font-bold text-foreground">
            {product.stockQuantity} units
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Layers className="h-4 w-4 text-primary" />
            Category
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground truncate">
            {typeof product.category === 'object' && product.category !== null
              ? product.category.name
              : 'Assigned'}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Status
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ActiveBadge isActive={product.isAvailable} activeLabel="Available" inactiveLabel="Unavailable" />
            {product.isDeleted && <DeletedBadge isDeleted={true} />}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Basic Info */}
        <FormSection
          title="General Information"
          description="Update basic identification attributes for this product."
        >
          <FormGrid cols={2}>
            <FormField label="Product Name" required error={errors.name?.message}>
              <Input
                {...register('name')}
                placeholder="Product name"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="SKU (Stock Keeping Unit)"
              required
              error={errors.sku?.message}
            >
              <div className="flex gap-2">
                <Input
                  {...register('sku')}
                  placeholder="SKU"
                  className="uppercase font-mono"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={generateSku}
                  title="Generate unique SKU"
                >
                  <Sparkles className="h-4 w-4" />
                  Auto
                </Button>
              </div>
            </FormField>
          </FormGrid>

          <FormGrid cols={2}>
            <FormField
              label="Category"
              required
              error={errors.category?.message}
            >
              <Select {...register('category')} disabled={isSubmitting}>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex items-center pt-6">
              <Controller
                control={control}
                name="isAvailable"
                render={({ field }) => (
                  <Checkbox
                    id="isAvailable"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    label="Available for ordering"
                    description="When disabled, this product cannot be ordered on POS or guest apps."
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Pricing & Stock */}
        <FormSection
          title="Pricing & Inventory"
          description="Modify customer pricing, wholesale cost, and current available inventory."
        >
          <FormGrid cols={3}>
            <FormField
              label="Selling Price ($)"
              required
              error={errors.price?.message}
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('price')}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Cost Price ($)"
              error={errors.costPrice?.message}
              hint="Internal cost"
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('costPrice')}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Stock Quantity"
              required
              error={errors.stockQuantity?.message}
            >
              <Input
                type="number"
                step="1"
                min="0"
                {...register('stockQuantity')}
                placeholder="0"
                disabled={isSubmitting}
              />
            </FormField>
          </FormGrid>
        </FormSection>

        {/* Media & Gallery */}
        <FormSection
          title="Product Photos"
          description="Manage up to 5 photos. Upload additional images or remove existing ones."
        >
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploader
                label="Product Images"
                description="PNG, JPG, WebP up to 10MB each (max 5 photos)"
                multiple={true}
                maxFiles={5}
                entityType="Product"
                entityId={product.id || product._id}
                value={field.value}
                onChange={(urls) => field.onChange(Array.isArray(urls) ? urls : [urls])}
                disabled={isSubmitting}
              />
            )}
          />
        </FormSection>

        {/* Description */}
        <FormSection
          title="Description & Notes"
          description="Details, allergens, preparation style, and ingredients."
        >
          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Product description and details..."
              rows={4}
              disabled={isSubmitting}
            />
          </FormField>
        </FormSection>

        {/* Metadata info footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Created: {formatDate(product.createdAt)}</span>
          <span>Last Updated: {formatDate(product.updatedAt)}</span>
        </div>

        {/* Form Actions */}
        <FormActions
          isSubmitting={isSubmitting}
          submitLabel={isDirty ? 'Save Changes' : 'Saved'}
          cancelLabel="Cancel"
          onCancel={() => router.push(ROUTES.PRODUCTS.LIST)}
        />
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This product will be soft-deleted and preserved in historical reports.`}
        confirmLabel="Soft Delete Product"
        variant="danger"
      />
    </div>
  );
}
