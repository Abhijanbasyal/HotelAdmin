import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';

/**
 * Root page — redirect to dashboard.
 * In Phase 2 this will check auth state and redirect to login if unauthenticated.
 */
export default function RootPage() {
  redirect(ROUTES.DASHBOARD);
}
