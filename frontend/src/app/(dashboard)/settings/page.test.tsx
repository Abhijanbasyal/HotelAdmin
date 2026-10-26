import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './page';
import * as settingApi from '@/services/api/setting.api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/settings',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api/setting.api', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

describe('SettingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (settingApi.getSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      _id: 's-1',
      id: 's-1',
      hotelName: 'Grand Palace Hotel',
      tagline: 'Luxury Living',
      logoUrl: null,
      email: 'info@grandpalace.com',
      phone: '+1-555-0100',
      address: '100 Ocean Drive',
      website: 'https://grandpalace.com',
      currency: 'USD',
      currencySymbol: '$',
      timezone: 'America/New_York',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      taxRate: 10,
      serviceChargeRate: 5,
      theme: 'system',
      dateFormat: 'YYYY-MM-DD',
      notificationsEnabled: true,
      updatedAt: new Date().toISOString(),
    });
  });

  it('renders settings page with hotel details in initial tab', async () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole('heading', { name: /Settings & Hotel Configuration/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hotel Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Operations & Billing/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Grand Palace Hotel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('info@grandpalace.com')).toBeInTheDocument();
    });
  });

  it('switches to Operations tab and updates parameters', async () => {
    (settingApi.updateSettings as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      _id: 's-1',
      hotelName: 'Grand Palace Hotel',
      taxRate: 15,
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Grand Palace Hotel')).toBeInTheDocument();
    });

    const opsTab = screen.getByRole('button', { name: /Operations & Billing/i });
    fireEvent.click(opsTab);

    expect(screen.getByText(/Operational Parameters/i)).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save Configuration/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(settingApi.updateSettings).toHaveBeenCalled();
    });
  });
});
