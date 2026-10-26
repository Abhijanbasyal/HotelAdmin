'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  Sliders,
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
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
  FormGrid,
  ImageUploader,
} from '@/components';
import {
  getSettings,
  updateSettings,
  type HotelSettings,
  type UpdateSettingPayload,
} from '@/services/api/setting.api';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const settingsSchema = z.object({
  hotelName: z.string().trim().min(2, 'Hotel name must be at least 2 characters').max(100),
  tagline: z.string().trim().max(200).optional(),
  logoUrl: z.string().nullable().optional(),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(5, 'Phone must be at least 5 characters').max(30),
  address: z.string().trim().max(300),
  website: z.string().trim().max(200).optional(),
  currency: z.string().trim().max(10),
  currencySymbol: z.string().trim().max(10),
  timezone: z.string().trim(),
  checkInTime: z.string().regex(timeRegex, 'Must be in HH:mm format'),
  checkOutTime: z.string().regex(timeRegex, 'Must be in HH:mm format'),
  taxRate: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseFloat(val) || 0))
    .refine((val) => val >= 0 && val <= 100, { message: 'Tax rate must be between 0% and 100%' }),
  serviceChargeRate: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'number' ? val : parseFloat(val) || 0))
    .refine((val) => val >= 0 && val <= 100, { message: 'Service charge must be between 0% and 100%' }),
  theme: z.enum(['system', 'light', 'dark']),
  dateFormat: z.string().trim(),
  notificationsEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - United States Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'NPR', label: 'NPR - Nepalese Rupee (Rs.)' },
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
  { value: 'AUD', label: 'AUD - Australian Dollar ($)' },
  { value: 'CAD', label: 'CAD - Canadian Dollar ($)' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (Pacific Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (+05:45)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (+08:00)' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'operations' | 'preferences'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSettings, setSavedSettings] = useState<HotelSettings | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      hotelName: '',
      tagline: '',
      logoUrl: '',
      email: '',
      phone: '',
      address: '',
      website: '',
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
    },
  });

  const selectedLogo = watch('logoUrl');
  const notificationsValue = watch('notificationsEnabled');

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSettings();
      setSavedSettings(data);
      reset({
        hotelName: data.hotelName,
        tagline: data.tagline || '',
        logoUrl: data.logoUrl || '',
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website || '',
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        timezone: data.timezone,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        taxRate: data.taxRate,
        serviceChargeRate: data.serviceChargeRate,
        theme: data.theme,
        dateFormat: data.dateFormat,
        notificationsEnabled: data.notificationsEnabled,
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      setIsSubmitting(true);
      const updated = await updateSettings(values as UpdateSettingPayload);
      setSavedSettings(updated);
      toast.success('System settings saved successfully');
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || err.message || 'Failed to save settings';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrencyChange = (curr: string) => {
    setValue('currency', curr, { shouldDirty: true });
    if (curr === 'USD' || curr === 'AUD' || curr === 'CAD') setValue('currencySymbol', '$');
    else if (curr === 'EUR') setValue('currencySymbol', '€');
    else if (curr === 'GBP') setValue('currencySymbol', '£');
    else if (curr === 'NPR') setValue('currencySymbol', 'Rs.');
    else if (curr === 'INR') setValue('currencySymbol', '₹');
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      <PageHeader
        title="Settings & Hotel Configuration"
        description="Configure your hotel profile, financial & operational rules, and user preferences."
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Settings', href: '/settings' },
            ]}
          />
        }
      />

      {/* Tabs Header */}
      <div className="flex border-b border-border space-x-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Hotel Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'operations'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Operations & Billing
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preferences'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          System Preferences
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: Hotel Profile */}
        {activeTab === 'profile' && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Hotel Details</h3>
              <p className="text-xs text-muted-foreground">
                Public identification information displayed on guest receipts and invoices.
              </p>
            </div>

            <ImageUploader
              label="Hotel Logo / Brand Emblem"
              entityType="Category"
              value={selectedLogo || undefined}
              onChange={(val) =>
                setValue('logoUrl', typeof val === 'string' ? val : val[0] || '', {
                  shouldDirty: true,
                })
              }
              disabled={isSubmitting || isLoading}
            />

            <FormGrid cols={2}>
              <FormField id="set-name" label="Hotel Name" error={errors.hotelName?.message} required>
                <Input
                  id="set-name"
                  {...register('hotelName')}
                  placeholder="e.g. Grand Palace Hotel"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>

              <FormField id="set-tagline" label="Tagline / Slogan" error={errors.tagline?.message}>
                <Input
                  id="set-tagline"
                  {...register('tagline')}
                  placeholder="e.g. Luxury Hospitality & Fine Dining"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>
            </FormGrid>

            <FormGrid cols={2}>
              <FormField id="set-email" label="Contact Email" error={errors.email?.message} required>
                <Input
                  id="set-email"
                  type="email"
                  {...register('email')}
                  placeholder="e.g. contact@grandpalace.com"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>

              <FormField id="set-phone" label="Contact Phone" error={errors.phone?.message} required>
                <Input
                  id="set-phone"
                  {...register('phone')}
                  placeholder="e.g. +1-555-0100"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>
            </FormGrid>

            <FormField id="set-address" label="Property Address" error={errors.address?.message} required>
              <Textarea
                id="set-address"
                {...register('address')}
                placeholder="e.g. 123 Ocean Boulevard, Suite 500, Miami, FL 33139"
                rows={2}
                disabled={isSubmitting || isLoading}
              />
            </FormField>

            <FormField id="set-website" label="Website URL" error={errors.website?.message}>
              <Input
                id="set-website"
                {...register('website')}
                placeholder="e.g. https://grandpalace.com"
                disabled={isSubmitting || isLoading}
              />
            </FormField>
          </div>
        )}

        {/* Tab 2: Operations & Billing */}
        {activeTab === 'operations' && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Operational Parameters</h3>
              <p className="text-xs text-muted-foreground">
                Set guest scheduling policies, base currency, and billing tax rates.
              </p>
            </div>

            <FormGrid cols={2}>
              <FormField id="set-currency" label="Base Currency" error={errors.currency?.message} required>
                <Select
                  id="set-currency"
                  {...register('currency')}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  options={CURRENCY_OPTIONS}
                  disabled={isSubmitting || isLoading}
                />
              </FormField>

              <FormField id="set-symbol" label="Currency Symbol" error={errors.currencySymbol?.message} required>
                <Input
                  id="set-symbol"
                  {...register('currencySymbol')}
                  placeholder="e.g. $"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>
            </FormGrid>

            <FormField id="set-tz" label="System Timezone" error={errors.timezone?.message} required>
              <Select
                id="set-tz"
                {...register('timezone')}
                options={TIMEZONE_OPTIONS}
                disabled={isSubmitting || isLoading}
              />
            </FormField>

            <FormGrid cols={2}>
              <FormField id="set-checkin" label="Standard Check-In Time" error={errors.checkInTime?.message} required>
                <Input
                  id="set-checkin"
                  type="time"
                  {...register('checkInTime')}
                  disabled={isSubmitting || isLoading}
                />
              </FormField>

              <FormField id="set-checkout" label="Standard Check-Out Time" error={errors.checkOutTime?.message} required>
                <Input
                  id="set-checkout"
                  type="time"
                  {...register('checkOutTime')}
                  disabled={isSubmitting || isLoading}
                />
              </FormField>
            </FormGrid>

            <FormGrid cols={2}>
              <FormField id="set-tax" label="Tax Rate (%)" error={errors.taxRate?.message} required>
                <Input
                  id="set-tax"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  {...register('taxRate', { valueAsNumber: true })}
                  placeholder="e.g. 10"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>

              <FormField id="set-service" label="Service Charge (%)" error={errors.serviceChargeRate?.message} required>
                <Input
                  id="set-service"
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  {...register('serviceChargeRate', { valueAsNumber: true })}
                  placeholder="e.g. 5"
                  disabled={isSubmitting || isLoading}
                />
              </FormField>
            </FormGrid>
          </div>
        )}

        {/* Tab 3: System Preferences */}
        {activeTab === 'preferences' && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">User Experience & Theme</h3>
              <p className="text-xs text-muted-foreground">
                Customize appearance themes and global notification defaults.
              </p>
            </div>

            <FormGrid cols={2}>
              <FormField id="set-theme" label="Interface Theme" error={errors.theme?.message} required>
                <Select
                  id="set-theme"
                  {...register('theme')}
                  options={[
                    { value: 'system', label: 'Follow System Default' },
                    { value: 'light', label: 'Light Mode' },
                    { value: 'dark', label: 'Dark Mode' },
                  ]}
                  disabled={isSubmitting || isLoading}
                />
              </FormField>

              <FormField id="set-dateformat" label="Date Display Format" error={errors.dateFormat?.message} required>
                <Select
                  id="set-dateformat"
                  {...register('dateFormat')}
                  options={[
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Standard)' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (Day-Month-Year)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (Month-Day-Year)' },
                  ]}
                  disabled={isSubmitting || isLoading}
                />
              </FormField>
            </FormGrid>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer">
                <Checkbox
                  checked={notificationsValue}
                  onChange={(e) =>
                    setValue('notificationsEnabled', e.target.checked, { shouldDirty: true })
                  }
                  disabled={isSubmitting || isLoading}
                />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Enable System Notifications
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Receive live toast notifications for booking transitions and room updates.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isDirty && (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                • Unsaved changes pending
              </span>
            )}
            {savedSettings && !isDirty && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> All settings synced
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void fetchSettings()}
              disabled={isSubmitting || isLoading || !isDirty}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="submit" size="md" isLoading={isSubmitting} disabled={isLoading}>
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
