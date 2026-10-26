'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  loginApi,
  refreshApi,
  logoutApi,
  logoutAllApi,
  type UserProfile,
} from '@/services/api/auth.api';
import { ROUTES } from '@/config/routes';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Transparently initialize auth on page load via HttpOnly refresh cookie
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const response = await refreshApi();
        if (isMounted && response.data?.user) {
          setUser(response.data.user);
        }
      } catch {
        // No active session — user needs to log in
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await loginApi({ email, password });
        if (response.data?.user) {
          setUser(response.data.user);
          toast.success(`Welcome back, ${response.data.user.name}!`);
          router.push(ROUTES.DASHBOARD);
        }
      } catch (err: unknown) {
        const message =
          (err as { message?: string }).message || 'Invalid email or password. Please try again.';
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutApi();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
      toast.info('You have been logged out.');
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      await logoutAllApi();
    } catch {
      // Continue client cleanup
    } finally {
      setUser(null);
      toast.info('Logged out from all active sessions.');
      router.push(ROUTES.LOGIN);
    }
  }, [router]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === 'Super Admin' || user.permissions.includes('*')) {
        return true;
      }
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        logoutAll,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
