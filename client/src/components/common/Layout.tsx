import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  breadcrumbs,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <header className="mb-6 sm:mb-8">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold sm:text-3xl text-balance">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[0.9375rem] text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionHeader({ title, description, action, id }: { title: string; description?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-lg font-bold">
          {title}
        </h2>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
            {c.to ? (
              <Link to={c.to} className="hover:text-brand-700 hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="max-w-[16rem] truncate font-medium text-ink-soft">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  to,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: 'brand' | 'warning' | 'indigo' | 'success' | 'slate';
  to?: string;
  hint?: string;
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    warning: 'bg-warning-soft text-warning',
    indigo: 'bg-indigo-50 text-indigo-700',
    success: 'bg-success-soft text-success',
    slate: 'bg-slate-100 text-ink-soft',
  };
  const body = (
    <>
      <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-tight tabular-nums">{value}</p>
        <p className="text-[0.8125rem] font-medium text-ink-muted">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      </div>
    </>
  );
  const cls = 'card flex items-center gap-3.5 p-4 transition';
  return to ? (
    <Link to={to} className={cn(cls, 'hover:-translate-y-0.5 hover:shadow-lift')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <button type="button" className="btn-secondary btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Previous</span>
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-ink-muted">…</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn('btn-sm btn min-w-[2.25rem] px-2', p === page ? 'bg-brand-600 text-white' : 'border border-line bg-white hover:bg-brand-50')}
          >
            {p}
          </button>
        </span>
      ))}
      <button type="button" className="btn-secondary btn-sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}

export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} of ${max}`}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
