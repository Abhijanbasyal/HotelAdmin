import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from './setting.api';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('Setting API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSettings fetches system settings', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          _id: 's-1',
          hotelName: 'Grand Palace Hotel',
          currency: 'USD',
          currencySymbol: '$',
          timezone: 'America/New_York',
        },
      },
    });

    const settings = await getSettings();

    expect(apiClient.get).toHaveBeenCalledWith('/settings');
    expect(settings.hotelName).toBe('Grand Palace Hotel');
    expect(settings.currency).toBe('USD');
  });

  it('updateSettings patches updated settings payload', async () => {
    const payload = {
      hotelName: 'Royal Resort & Spa',
      taxRate: 15,
    };
    (apiClient.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: { _id: 's-1', ...payload } },
    });

    const settings = await updateSettings(payload);

    expect(apiClient.patch).toHaveBeenCalledWith('/settings', payload);
    expect(settings.hotelName).toBe('Royal Resort & Spa');
  });
});
