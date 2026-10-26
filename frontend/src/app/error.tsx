'use client';

import { Button } from '@/components/ui/Button';
import { ServerCrash } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-subtle text-danger">
          <ServerCrash className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {process.env.NODE_ENV === 'development'
              ? error.message
              : 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
