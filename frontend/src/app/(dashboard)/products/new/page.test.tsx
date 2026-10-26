import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewProductPage from './page';
import * as categoryApi from '@/services/api/category.api';
import * as productApi from '@/services/api/product.api';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/products/new',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/category.api', () => ({
  getActiveCategories: vi.fn(),
}));

vi.mock('@/services/api/product.api', () => ({
  createProduct: vi.fn(),
}));

describe('NewProductPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (categoryApi.getActiveCategories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { _id: 'cat-1', name: 'Beverages' },
      { _id: 'cat-2', name: 'Snacks' },
    ]);
  });

  it('renders form fields and loads categories into select dropdown', async () => {
    render(<NewProductPage />);

    expect(screen.getByRole('heading', { name: /Add Product/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Club Sandwich/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. BEV-ESP01/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Beverages' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Snacks' })).toBeInTheDocument();
    });
  });

  it('generates SKU automatically when clicking Auto button', async () => {
    render(<NewProductPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Beverages' })).toBeInTheDocument();
    });

    const autoBtn = screen.getByTitle('Generate unique SKU');
    fireEvent.click(autoBtn);

    const skuInput = screen.getByPlaceholderText(/e\.g\. BEV-ESP01/i) as HTMLInputElement;
    expect(skuInput.value).toMatch(/^BEV-/);
  });

  it('submits form with valid payload and redirects to product list', async () => {
    (productApi.createProduct as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 'prod-new',
      name: 'Iced Latte',
      sku: 'BEV-ICED',
      price: 5.5,
    });

    render(<NewProductPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Beverages' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Club Sandwich/i), {
      target: { value: 'Iced Latte' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. BEV-ESP01/i), {
      target: { value: 'bev-iced' },
    });
    fireEvent.change(screen.getByLabelText(/Selling Price/i), {
      target: { value: '5.50' },
    });

    const submitBtn = screen.getByRole('button', { name: /Create Product/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(productApi.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Iced Latte',
          sku: 'BEV-ICED',
          price: 5.5,
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/products');
    });
  });
});
