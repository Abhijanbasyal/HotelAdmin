import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/products/new',
}));

describe('Breadcrumbs', () => {
  it('renders explicit breadcrumbs when provided', () => {
    const items = [
      { label: 'Products', href: '/products' },
      { label: 'New Product' },
    ];
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('renders automatic breadcrumbs from pathname when no items passed', () => {
    render(<Breadcrumbs />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});
