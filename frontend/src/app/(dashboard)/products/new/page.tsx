'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, ArrowLeft } from 'lucide-react';
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
} from '@/components';
import { createProduct } from '@/services/api/product.api';
import { getActiveCategories } from '@/services/api/category.api';
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

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
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

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getActiveCategories();
        setCategories(cats);
        if (cats.length > 0 && !currentCategory) {
          setValue('category', cats[0]._id);
        }
      } catch {
        toast.error('Failed to load categories');
      } finally {
        setIsLoadingCategories(false);
      }
    }
    void loadCategories();
  }, [setValue, currentCategory]);

  const generateSku = () => {
    const selectedCat = categories.find((c) => c._id === currentCategory);
    const prefix = selectedCat ? selectedCat.name.substring(0, 3).toUpperCase() : 'PRD';
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timeSnippet = Date.now().toString().slice(-3);
    const generated = `${prefix}-${randomHex}${timeSnippet}`;
    setValue('sku', generated, { shouldValidate: true });
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const created = await createProduct({
        ...values,
        sku: values.sku.toUpperCase(),
      });
      toast.success(`Product "${created.name}" created successfully`);
      router.push(ROUTES.PRODUCTS.LIST);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to create product';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Add Product"
        description="Create a new food, beverage, minibar, or hotel service product."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: ROUTES.DASHBOARD },
              { label: 'Products', href: ROUTES.PRODUCTS.LIST },
              { label: 'New Product' },
            ]}
          />
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.PRODUCTS.LIST)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Section 1: Basic Information */}
        <FormSection
          title="Basic Information"
          description="Enter the core identification details for the product."
        >
          <FormGrid cols={2}>
            <FormField id="name" label="Product Name" required error={errors.name?.message}>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g. Club Sandwich, Espresso, Mineral Water"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              id="sku"
              label="SKU (Stock Keeping Unit)"
              required
              error={errors.sku?.message}
              hint="Unique identifier used across POS, inventory, and kitchen."
            >
              <div className="flex gap-2">
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="e.g. BEV-ESP01"
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
              id="category"
              label="Category"
              required
              error={errors.category?.message}
              hint={categories.length === 0 && !isLoadingCategories ? 'Please create an active category first.' : undefined}
            >
              <Select id="category" {...register('category')} disabled={isSubmitting || isLoadingCategories}>
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                )}
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
                    description="When disabled, this product is hidden from staff POS and guest menus."
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Section 2: Pricing & Inventory */}
        <FormSection
          title="Pricing & Inventory"
          description="Specify selling price, optional cost price for margin calculation, and current stock level."
        >
          <FormGrid cols={3}>
            <FormField
              id="price"
              label="Selling Price ($)"
              required
              error={errors.price?.message}
              hint="Customer-facing menu price"
            >
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price')}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              id="costPrice"
              label="Cost Price ($)"
              error={errors.costPrice?.message}
              hint="Internal wholesale/preparation cost"
            >
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                {...register('costPrice')}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              id="stockQuantity"
              label="Stock Quantity"
              required
              error={errors.stockQuantity?.message}
              hint="Current units in storage"
            >
              <Input
                id="stockQuantity"
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

        {/* Section 3: Media & Gallery */}
        <FormSection
          title="Media & Gallery"
          description="Upload up to 5 high-resolution photos for this product. The first photo serves as the primary cover."
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
                value={field.value}
                onChange={(urls) => field.onChange(Array.isArray(urls) ? urls : [urls])}
                disabled={isSubmitting}
              />
            )}
          />
        </FormSection>

        {/* Section 4: Description */}
        <FormSection
          title="Description & Notes"
          description="Provide details, ingredients, allergen warnings, or special preparation notes."
        >
          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="e.g. Freshly brewed double shot espresso using 100% Arabica single-origin beans..."
              rows={4}
              disabled={isSubmitting}
            />
          </FormField>
        </FormSection>

        {/* Form Actions */}
        <FormActions
          isSubmitting={isSubmitting}
          submitLabel="Create Product"
          cancelLabel="Cancel"
          onCancel={() => router.push(ROUTES.PRODUCTS.LIST)}
        />
      </form>
    </div>
  );
}
