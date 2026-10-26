import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Hotel Management',
    default: 'Hotel Management Admin',
  },
  description:
    'Professional hotel management administration system for managing products, bookings, staff, and more.',
  robots: {
    index: false, // Admin panel should not be indexed
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <AppThemeProvider>
          <AuthProvider>
            {children}
            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 4000,
                classNames: {
                  toast: 'border border-border bg-card text-foreground shadow-dropdown',
                  title: 'text-foreground font-medium',
                  description: 'text-muted-foreground text-sm',
                },
              }}
            />
          </AuthProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
