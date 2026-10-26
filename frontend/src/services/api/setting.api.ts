import { apiClient, type ApiResponse } from './client';

export interface HotelSettings {
  id: string;
  _id: string;
  hotelName: string;
  tagline?: string;
  logoUrl?: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  serviceChargeRate: number;
  theme: 'system' | 'light' | 'dark';
  dateFormat: string;
  notificationsEnabled: boolean;
  updatedAt: string;
}

export type UpdateSettingPayload = Partial<Omit<HotelSettings, 'id' | '_id' | 'updatedAt'>>;

export async function getSettings(): Promise<HotelSettings> {
  const response = await apiClient.get<ApiResponse<HotelSettings>>('/settings');
  return response.data.data!;
}

export async function updateSettings(payload: UpdateSettingPayload): Promise<HotelSettings> {
  const response = await apiClient.patch<ApiResponse<HotelSettings>>('/settings', payload);
  return response.data.data!;
}
