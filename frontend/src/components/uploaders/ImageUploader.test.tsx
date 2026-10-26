import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploader } from './ImageUploader';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ImageUploader Component', () => {
  it('renders label, helper text, and upload trigger', () => {
    render(
      <ImageUploader
        label="Product Photo"
        description="Upload product photo in high resolution"
      />
    );

    expect(screen.getByText('Product Photo')).toBeInTheDocument();
    expect(screen.getByText('Upload product photo in high resolution')).toBeInTheDocument();
    expect(screen.getByText(/Click to browse/i)).toBeInTheDocument();
  });

  it('renders preview image when value is provided', () => {
    render(
      <ImageUploader
        label="Single Image"
        value="/api/v1/assets/file/images/products/test.png"
      />
    );

    const img = screen.getByAltText('Preview 1');
    expect(img).toBeInTheDocument();
  });

  it('calls onChange with empty string when removing single image', () => {
    const handleChange = vi.fn();
    render(
      <ImageUploader
        label="Single Image"
        value="/api/v1/assets/file/images/products/test.png"
        onChange={handleChange}
      />
    );

    const removeBtn = screen.getByTitle('Remove image');
    fireEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('renders multiple preview thumbnails when multiple is true', () => {
    const images = [
      '/api/v1/assets/file/images/products/test1.png',
      '/api/v1/assets/file/images/products/test2.png',
    ];
    render(
      <ImageUploader
        label="Gallery"
        multiple
        value={images}
      />
    );

    expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
  });
});
