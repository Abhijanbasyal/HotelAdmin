'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Search,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Breadcrumbs,
  PageHeader,
  DataTable,
  ConfirmDialog,
  Button,
  Input,
  Select,
  ActiveBadge,
  type ColumnDef,
  type RowAction,
} from '@/components';
import {
  listProducts,
  deleteProduct,
  restoreProduct,
  type ProductItem,
} from '@/services/api/product.api';
import { getActiveCategories } from '@/services/api/category.api';
import { getAssetUrl } from '@/services/api/asset.api';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/config/routes';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'in_stock' | 'out_of_stock' | 'low_stock' | ''
  >('');
  const [categoriesList, setCategoriesList] = useState<Array<{ _id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);

  // Load category dropdown items
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getActiveCategories();
        setCategoriesList(cats);
      } catch {
        // silent fallback
      }
    }
    void loadCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const isAvailableBool =
        availabilityFilter === 'true'
          ? true
          : availabilityFilter === 'false'
            ? false
            : undefined;

      const res = await listProducts({
        page,
        limit,
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        isAvailable: isAvailableBool,
        stockStatus: stockStatusFilter || undefined,
      });

      setProducts(res.data);
      setTotal(res.meta.pagination.total);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, categoryFilter, availabilityFilter, stockStatusFilter]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id || productToDelete._id);
      toast.success(`Product "${productToDelete.name}" soft-deleted`);
      setProductToDelete(null);
      void fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to delete product';
      toast.error(msg);
    }
  };

  const handleRestore = async (prod: ProductItem) => {
    try {
      await restoreProduct(prod.id || prod._id);
      toast.success(`Product "${prod.name}" restored successfully`);
      void fetchProducts();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to restore product';
      toast.error(msg);
    }
  };

  const columns: ColumnDef<ProductItem>[] = [
    {
      id: 'thumbnail',
      header: 'Image',
      cell: (row) => {
        const primaryImage = row.images && row.images.length > 0 ? row.images[0] : null;
        return (
          <div className="h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 flex items-center justify-center">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getAssetUrl(primaryImage)}
                alt={row.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Package className="h-5 w-5 text-slate-400" />
            )}
          </div>
        );
      },
    },
    {
      id: 'name',
      header: 'Product & SKU',
      sortKey: 'name',
      cell: (row) => (
        <div>
          <Link
            href={ROUTES.PRODUCTS.DETAIL(row.id || row._id)}
            className="font-semibold text-slate-900 hover:text-primary dark:text-slate-100 dark:hover:text-primary transition-colors"
          >
            {row.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {row.sku}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      cell: (row) => {
        const catName =
          typeof row.category === 'object' && row.category !== null
            ? row.category.name
            : 'Uncategorized';
        return <span className="text-sm text-slate-700 dark:text-slate-300">{catName}</span>;
      },
    },
    {
      id: 'price',
      header: 'Price',
      sortKey: 'price',
      cell: (row) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrency(row.price)}
        </span>
      ),
    },
    {
      id: 'stockQuantity',
      header: 'Stock',
      sortKey: 'stockQuantity',
      cell: (row) => {
        const qty = row.stockQuantity;
        if (qty === 0) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full">
              <AlertTriangle className="h-3 w-3" />
              Out of stock
            </span>
          );
        }
        if (qty <= 5) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
              Low: {qty} left
            </span>
          );
        }
        return <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{qty} in stock</span>;
      },
    },
    {
      id: 'isAvailable',
      header: 'Status',
      cell: (row) => <ActiveBadge isActive={row.isAvailable} activeLabel="Available" inactiveLabel="Unavailable" />,
    },
  ];

  const actions: RowAction<ProductItem>[] = [
    {
      label: 'Edit',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: (row) => router.push(ROUTES.PRODUCTS.DETAIL(row.id || row._id)),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      hidden: (row) => row.isDeleted,
      onClick: (row) => setProductToDelete(row),
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
        title="Products"
        description="Manage your hotel food & beverage items, room service inventory, and pricing."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Products' },
            ]}
          />
        }
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.PRODUCTS.NEW}>
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {/* Availability Filter */}
          <Select
            value={availabilityFilter}
            onChange={(e) => {
              setAvailabilityFilter(e.target.value);
              setPage(1);
            }}
            className="w-36"
          >
            <option value="">All States</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </Select>

          {/* Stock Status Filter */}
          <Select
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value as 'in_stock' | 'out_of_stock' | 'low_stock' | '');
              setPage(1);
            }}
            className="w-36"
          >
            <option value="">All Stock</option>
            <option value="in_stock">In Stock (&gt;5)</option>
            <option value="low_stock">Low Stock (≤5)</option>
            <option value="out_of_stock">Out of Stock</option>
          </Select>
        </div>
      </div>

      {/* Shared DataTable */}
      <DataTable
        data={products}
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
        emptyTitle="No products found"
        emptyDescription="No products match your filter criteria. Click 'Add Product' to create one."
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Delete Product"
        message={`Are you sure you want to delete product "${productToDelete?.name}" (SKU: ${productToDelete?.sku})? This product will be soft-deleted and preserved in historical reports.`}
        confirmLabel="Soft Delete Product"
        variant="danger"
      />
    </div>
  );
}
