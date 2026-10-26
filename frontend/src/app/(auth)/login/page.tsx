'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Hotel, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Inputs';
import { FormField } from '@/components/forms/FormField';

const loginFormSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch {
      // Toast error is handled inside AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setValue('email', 'admin@hoteladmin.com', { shouldValidate: true });
    setValue('password', 'Admin@123456', { shouldValidate: true });
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Card */}
      <div className="rounded-2xl border border-border bg-card shadow-modal p-8 backdrop-blur-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Hotel className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hotel Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access your administrative dashboard
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField id="email" label="Email address" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              placeholder="admin@hoteladmin.com"
              autoComplete="email"
              leftElement={<Mail className="h-4 w-4" />}
              {...register('email')}
            />
          </FormField>

          <FormField id="password" label="Password" required error={errors.password?.message}>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              leftElement={<Lock className="h-4 w-4" />}
              rightElement={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Demo credentials shortcut */}
        <div className="mt-6 pt-6 border-t border-border">
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Fill Demo Admin Credentials</span>
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            admin@hoteladmin.com &bull; Admin@123456
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Secure token authentication with refresh rotation &bull; Argon2id
      </p>
    </div>
  );
}
