import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/config/routes';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-6xl font-black text-primary mb-2">404</h1>
          <h2 className="text-xl font-bold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.DASHBOARD}>Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
