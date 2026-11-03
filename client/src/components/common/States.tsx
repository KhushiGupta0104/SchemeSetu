import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import { ApiError } from '@/services/api';
import { cn } from '@/utils/cn';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('card flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden />}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title, className }: { error?: unknown; onRetry?: () => void; title?: string; className?: string }) {
  const offline = error instanceof ApiError && (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT');
  const message = error instanceof Error ? error.message : 'Something went wrong while loading this section.';
  return (
    <div role="alert" className={cn('card flex flex-col items-center px-6 py-10 text-center', className)}>
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger-soft text-danger">
        {offline ? <WifiOff className="h-7 w-7" aria-hidden /> : <AlertTriangle className="h-7 w-7" aria-hidden />}
      </div>
      <h3 className="text-lg font-bold">{title ?? (offline ? 'You seem to be offline' : 'We hit a problem')}</h3>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-5">
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function SchemeCardSkeleton() {
  return (
    <div className="card p-5" aria-hidden>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-3/5" />
      <Skeleton className="mt-4 h-12 w-full" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

/** Grid of card skeletons with an accessible loading announcement. */
export function LoadingSkeleton({ count = 6, label = 'Loading' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <SchemeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div role="status" className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-3 text-ink-muted">
        <Spinner className="h-5 w-5 text-brand-600" /> <span>Loading…</span>
      </div>
    </div>
  );
}
